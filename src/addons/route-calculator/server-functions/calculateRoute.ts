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
// TODO: CRITICAL - Remove all fallback/made-up distance/time estimates (lines 138, 228, 300, geocoding.ts:105-107)
// TODO: When addresses fail to geocode or distance matrix fails, we should error or warn user explicitly
// TODO: Made-up numbers are misleading - user needs to know when data is unreliable
// TODO: Remove fallback startTime on line 121 - startTime should always come from client, throw error if missing

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
import { geocodeAddresses, calculateDistanceMatrix } from './geocoding'
import type {
  Property,
  RouteStructure,
  CalculateRouteRequest,
  Coordinates
} from '../types'
import { CalculateRouteRequestSchema } from '../types'

export async function calculateRoute(requestData: CalculateRouteRequest): Promise<RouteStructure> {
  try {
    const validatedData = CalculateRouteRequestSchema.parse(requestData)
    
    const route = await optimizeRoute(validatedData)
    return route
  } catch (error) {
    console.error('Route calculation error:', error)
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred')
  }
}


async function optimizeRoute(request: CalculateRouteRequest): Promise<RouteStructure> {
  // Step 1: Geocode all addresses
  const geocodingResults = await geocodeAddresses(request.addresses)

  // Check for failed geocoding - don't use fallback coordinates
  const failedAddresses = geocodingResults.filter(r => r.coordinates === null)
  if (failedAddresses.length > 0) {
    throw new Error(`Failed to geocode addresses: ${failedAddresses.map(r => r.address).join(', ')}`)
  }

  // Step 2: Create properties with coordinates
  const properties: Property[] = geocodingResults.map((result, index) => ({
    id: `prop_${index}`,
    address: result.address,
    showingDuration: request.showingDuration,
    appointmentTime: null,
    isFrozen: false,
    coordinates: result.coordinates,
  }))

  // Step 3: Calculate distance matrix for all coordinates
  const coordinates = properties.map(p => p.coordinates!) as Coordinates[]

  let distanceMatrix
  if (coordinates.length > 1) {
    distanceMatrix = await calculateDistanceMatrix(coordinates, coordinates)
  } else {
    // Single property - create dummy matrix
    distanceMatrix = {
      origins: coordinates,
      destinations: coordinates,
      durations: [[0]],
      distances: [[0]],
    }
  }

  // Step 4: Optimize route using traveling salesman approach
  const optimizedIndices = optimizeTravelingSalesman(
    distanceMatrix.durations,
    request.startingPropertyIndex,
    properties
  )

  // Step 5: Build route structure with durations only (no appointment times)
  const routeItems = optimizedIndices.map((propertyIndex, routeIndex) => {
    const property = properties[propertyIndex]
    let travelTime = 0

    if (routeIndex > 0) {
      const prevPropertyIndex = optimizedIndices[routeIndex - 1]

      // Get travel time from distance matrix - no fallbacks
      if (distanceMatrix.durations[prevPropertyIndex] &&
          distanceMatrix.durations[prevPropertyIndex][propertyIndex] !== undefined) {
        travelTime = distanceMatrix.durations[prevPropertyIndex][propertyIndex]
      } else {
        throw new Error(`Missing distance matrix data between properties ${prevPropertyIndex} and ${propertyIndex}`)
      }
    }

    return {
      propertyIndex,
      property: {
        ...property,
        appointmentTime: null,
      },
      travelTime,
    }
  })

  // Step 6: Calculate total driving time
  const totalDrivingTime = routeItems.reduce((sum, item) => sum + item.travelTime, 0)

  return {
    items: routeItems,
    totalDrivingTime,
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