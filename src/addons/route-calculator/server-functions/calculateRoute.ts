'use server'

// TODO: Break server functions into separate endpoints for better UX:
// TODO: 1. POST /calculate - initial route (addresses, startTime, startingPropertyIndex, defaultDuration)
// TODO: 2. POST /update-duration - change specific property duration (propertyIndex, newDuration)
// TODO: 3. POST /freeze-appointment - lock specific time slots (propertyIndex, appointmentTime)
// TODO: 4. POST /re-optimize - recalculate with all current constraints (existing route + frozen times)
// TODO: Current bundled approach works but limits user workflow flexibility
// TODO: Separate endpoints allow granular updates without full recalculation
// TODO: Add proper error handling and validation
// TODO: Implement rate limiting and request throttling  
// TODO: Add caching for repeated geocoding requests
// TODO: Optimize TSP algorithm for larger property sets
// TODO: Add support for time constraints and business hours
// TODO: Implement real-time traffic data integration

// TODO: Add server persistence for route customizations (after custom hook implementation)
// CONTEXT: User wants to persist route modifications (appointment time/duration changes) to server
// BENEFITS: Session continuity, multi-device access, collaboration/sharing, audit trail, backup
// APPROACH: Background sync from custom hook - user gets immediate client updates + server persistence
// IMPLEMENTATION: 
//   1. Create POST /save-route endpoint to persist modified routes with unique ID
//   2. Add debouncedServerSync() in custom hook for non-blocking background saves
//   3. Add GET /route/:id endpoint to load saved routes
//   4. Consider route versioning for audit trail
//   5. Add route sharing functionality via unique URLs
// MIGRATION PATH: Start with simple background sync, can add optimistic updates later
// RELATED: This works alongside the custom hook approach for client-side cascading

import { z } from 'zod'
import { format, parse, addMinutes } from 'date-fns'
import { geocodeAddresses, calculateDistanceMatrix } from './geocoding'
import type { 
  Property, 
  OptimizedRoute, 
  RouteItem, 
  CalculateRouteRequest, 
  CalculateRouteResponse,
  Coordinates 
} from '../types'
import { CalculateRouteRequestSchema, ReOptimizeRequestSchema } from '../types'

export async function calculateRoute(requestData: CalculateRouteRequest): Promise<OptimizedRoute> {
  try {
    const validatedData = CalculateRouteRequestSchema.parse(requestData)
    
    const route = await optimizeRoute(validatedData)
    return route
  } catch (error) {
    console.error('Route calculation error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}

export async function reOptimizeRoute(request: Request): Promise<Response> {
  try {
    const body = await request.json()
    const validatedData = ReOptimizeRequestSchema.parse(body)
    
    // Extract current route data and re-optimize with frozen appointments
    const addresses = validatedData.route.items.map(item => item.property.address)
    const startingPropertyIndex = 0 // Can be determined from the current route
    
    const optimizeRequest: CalculateRouteRequest = {
      addresses,
      showingDuration: validatedData.route.items[0]?.property.showingDuration || 30,
      startingPropertyIndex,
      frozenAppointments: validatedData.frozenAppointments,
    }
    
    const route = await optimizeRoute(optimizeRequest)
    
    const response: CalculateRouteResponse = {
      success: true,
      route,
    }
    
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Route re-optimization error:', error)
    
    const response: CalculateRouteResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
    
    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function optimizeRoute(request: CalculateRouteRequest): Promise<OptimizedRoute> {
  // Step 1: Geocode all addresses
  const geocodingResults = await geocodeAddresses(request.addresses)
  
  // Step 2: Create properties with coordinates
  const properties: Property[] = geocodingResults.map((result, index) => ({
    id: `prop_${index}`,
    address: result.address,
    showingDuration: request.showingDuration,
    appointmentTime: null,
    isFrozen: false,
    coordinates: result.coordinates,
  }))
  
  // Step 3: Apply frozen appointments if provided
  if (request.frozenAppointments) {
    request.frozenAppointments.forEach(frozen => {
      if (properties[frozen.propertyIndex]) {
        properties[frozen.propertyIndex].isFrozen = true
        properties[frozen.propertyIndex].appointmentTime = parse(frozen.appointmentTime, 'HH:mm', new Date())
      }
    })
  }
  
  // Step 4: Calculate distance matrix for valid coordinates
  const validProperties = properties.filter(p => p.coordinates !== null)
  const validCoordinates = validProperties.map(p => p.coordinates!) as Coordinates[]
  
  let distanceMatrix
  if (validCoordinates.length > 1) {
    distanceMatrix = await calculateDistanceMatrix(validCoordinates, validCoordinates)
  } else {
    // Single property or no valid coordinates - create dummy matrix
    distanceMatrix = {
      origins: validCoordinates,
      destinations: validCoordinates,
      durations: [[0]],
      distances: [[0]],
    }
  }
  
  // Step 5: Optimize route using traveling salesman approach
  const optimizedIndices = optimizeTravelingSalesman(
    distanceMatrix.durations,
    request.startingPropertyIndex,
    properties
  )
  
  // Step 6: Calculate appointment times
  const startTime = request.startTime ? 
    parse(request.startTime, 'HH:mm', new Date()) : 
    new Date(Date.now() + 60 * 60 * 1000) // Default to 1 hour from now
    
  startTime.setHours(Math.max(9, startTime.getHours())) // Ensure reasonable start time
  
  const routeItems: RouteItem[] = []
  let currentTime = new Date(startTime)
  
  optimizedIndices.forEach((propertyIndex, routeIndex) => {
    const property = properties[propertyIndex]
    let travelTime = 0
    
    if (routeIndex > 0) {
      const prevPropertyIndex = optimizedIndices[routeIndex - 1]
      const prevCoordIndex = validProperties.findIndex(p => p === properties[prevPropertyIndex])
      const currentCoordIndex = validProperties.findIndex(p => p === property)
      
      if (prevCoordIndex >= 0 && currentCoordIndex >= 0 && distanceMatrix.durations[prevCoordIndex]) {
        travelTime = distanceMatrix.durations[prevCoordIndex][currentCoordIndex] || 10
      } else {
        travelTime = 10 // Default fallback
      }
      
      currentTime = addMinutes(currentTime, travelTime)
    }
    
    // Use frozen time if available, otherwise use calculated time
    const appointmentTime = property.isFrozen && property.appointmentTime ? 
      property.appointmentTime : 
      new Date(currentTime)
    
    routeItems.push({
      propertyIndex,
      property: {
        ...property,
        appointmentTime,
      },
      appointmentTime,
      travelTime,
    })
    
    // Move to next appointment (add showing duration)
    currentTime = addMinutes(appointmentTime, property.showingDuration)
  })
  
  // Step 7: Calculate totals
  const totalDrivingTime = routeItems.reduce((sum, item) => sum + item.travelTime, 0)
  const totalShowingTime = routeItems.reduce((sum, item) => sum + item.property.showingDuration, 0)
  const totalTime = totalDrivingTime + totalShowingTime
  
  const endTime = routeItems.length > 0 ? 
    addMinutes(routeItems[routeItems.length - 1].appointmentTime, routeItems[routeItems.length - 1].property.showingDuration) :
    startTime
  
  return {
    items: routeItems,
    totalTime,
    totalDrivingTime,
    totalShowingTime,
    startTime,
    endTime,
  }
}

function optimizeTravelingSalesman(
  distanceMatrix: number[][], 
  startIndex: number,
  properties: Property[]
): number[] {
  const n = properties.length
  
  if (n <= 1) return [0]
  if (n === 2) return [startIndex, 1 - startIndex]
  
  // Simple nearest neighbor heuristic for small problems
  if (n <= 10) {
    return nearestNeighborTSP(distanceMatrix, startIndex, properties)
  }
  
  // For larger problems, use a more sophisticated approach
  return optimizedTSP(distanceMatrix, startIndex, properties)
}

function nearestNeighborTSP(
  distanceMatrix: number[][], 
  startIndex: number,
  properties: Property[]
): number[] {
  const n = properties.length
  const visited = new Set<number>()
  const route = [startIndex]
  visited.add(startIndex)
  
  let currentIndex = startIndex
  
  while (visited.size < n) {
    let nearestIndex = -1
    let nearestDistance = Infinity
    
    for (let i = 0; i < n; i++) {
      if (!visited.has(i)) {
        // Handle case where distance matrix might not cover all properties
        let distance = Infinity
        
        if (currentIndex < distanceMatrix.length && i < distanceMatrix[currentIndex].length) {
          distance = distanceMatrix[currentIndex][i]
        } else {
          // Fallback distance estimation
          distance = Math.abs(i - currentIndex) * 10 + 5
        }
        
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearestIndex = i
        }
      }
    }
    
    if (nearestIndex !== -1) {
      route.push(nearestIndex)
      visited.add(nearestIndex)
      currentIndex = nearestIndex
    } else {
      break
    }
  }
  
  return route
}

function optimizedTSP(
  distanceMatrix: number[][], 
  startIndex: number,
  properties: Property[]
): number[] {
  // For larger problems, we can implement more sophisticated algorithms
  // For now, fall back to nearest neighbor with some optimizations
  const route = nearestNeighborTSP(distanceMatrix, startIndex, properties)
  
  // Apply 2-opt improvement
  return twoOptImprovement(route, distanceMatrix)
}

function twoOptImprovement(route: number[], distanceMatrix: number[][]): number[] {
  let improved = true
  let bestRoute = [...route]
  
  while (improved) {
    improved = false
    
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length; j++) {
        if (j - i === 1) continue // Skip adjacent edges
        
        const newRoute = [...bestRoute]
        // Reverse the segment between i and j
        const segment = newRoute.slice(i, j + 1).reverse()
        newRoute.splice(i, j - i + 1, ...segment)
        
        if (calculateRouteDistance(newRoute, distanceMatrix) < calculateRouteDistance(bestRoute, distanceMatrix)) {
          bestRoute = newRoute
          improved = true
        }
      }
    }
  }
  
  return bestRoute
}

function calculateRouteDistance(route: number[], distanceMatrix: number[][]): number {
  let totalDistance = 0
  
  for (let i = 0; i < route.length - 1; i++) {
    const from = route[i]
    const to = route[i + 1]
    
    if (from < distanceMatrix.length && to < distanceMatrix[from].length) {
      totalDistance += distanceMatrix[from][to]
    } else {
      totalDistance += 10 // Fallback distance
    }
  }
  
  return totalDistance
}