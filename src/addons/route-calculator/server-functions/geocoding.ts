'use server'

import { Client } from '@googlemaps/google-maps-services-js'
import type { GeocodingResult, DistanceMatrixResult, Coordinates } from '../types'
import { env } from 'cloudflare:workers'

const client = new Client({})

export async function geocodeAddresses(addresses: string[]): Promise<GeocodingResult[]> {
  if (!env.GOOGLE_MAPS_API_KEY_SERVER) {
    throw new Error('Google Maps server API key not configured')
  }

  const results: GeocodingResult[] = []

  for (const address of addresses) {
    try {
      const encodedAddress = encodeURIComponent(address)
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${env.GOOGLE_MAPS_API_KEY_SERVER}`
      
      const response = await fetch(url)
      const data = await response.json() as {
        results?: Array<{
          geometry: { location: { lat: number; lng: number } }
          formatted_address: string
        }>
        status?: string
        error_message?: string
      }

      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        const location = result.geometry.location

        results.push({
          address,
          coordinates: {
            lat: location.lat,
            lng: location.lng,
          },
          formattedAddress: result.formatted_address,
        })
      } else {
        console.warn(`Failed to geocode address: ${address}`, 'Status:', data.status, 'Error:', data.error_message)
        results.push({
          address,
          coordinates: null,
          formattedAddress: address,
        })
      }
    } catch (error) {
      console.error(`Error geocoding address ${address}:`, error)
      results.push({
        address,
        coordinates: null,
        formattedAddress: address,
      })
    }

    // Add a small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

export async function calculateDistanceMatrix(
  origins: Coordinates[],
  destinations: Coordinates[]
): Promise<DistanceMatrixResult> {
  if (!env.GOOGLE_MAPS_API_KEY_SERVER) {
    throw new Error('Google Maps server API key not configured')
  }

  try {
    const originsStr = origins.map(coord => `${coord.lat},${coord.lng}`).join('|')
    const destinationsStr = destinations.map(coord => `${coord.lat},${coord.lng}`).join('|')
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(originsStr)}&destinations=${encodeURIComponent(destinationsStr)}&units=metric&mode=driving&key=${env.GOOGLE_MAPS_API_KEY_SERVER}`
    
    const response = await fetch(url)
    const data = await response.json() as {
      rows: Array<{
        elements: Array<{
          status: string
          duration?: { value: number }
          distance?: { value: number }
        }>
      }>
    }

    const durations: number[][] = []
    const distances: number[][] = []

    data.rows.forEach((row, originIndex: number) => {
      durations[originIndex] = []
      distances[originIndex] = []

      row.elements.forEach((element, destIndex: number) => {
        if (element.status === 'OK' && element.duration && element.distance) {
          // Convert seconds to minutes
          durations[originIndex][destIndex] = Math.ceil(element.duration.value / 60)
          distances[originIndex][destIndex] = element.distance.value
        } else {
          // Fallback estimation if API fails
          const fallbackTime = estimateDirectDistance(origins[originIndex], destinations[destIndex])
          durations[originIndex][destIndex] = fallbackTime
          distances[originIndex][destIndex] = fallbackTime * 1000 // rough estimate
        }
      })
    })

    return {
      origins,
      destinations,
      durations,
      distances,
    }
  } catch (error) {
    console.error('Error calculating distance matrix:', error)
    
    // Fallback to estimated times if API fails
    const durations = origins.map((origin, i) =>
      destinations.map((dest, j) => 
        i === j ? 0 : estimateDirectDistance(origin, dest)
      )
    )
    
    const distances = durations.map(row => 
      row.map(time => time * 1000) // rough estimate
    )

    return {
      origins,
      destinations,
      durations,
      distances,
    }
  }
}

function estimateDirectDistance(origin: Coordinates, destination: Coordinates): number {
  // Simple estimation based on straight-line distance
  // This is a fallback when the API is unavailable
  const R = 6371 // Earth's radius in km
  const dLat = toRad(destination.lat - origin.lat)
  const dLon = toRad(destination.lng - origin.lng)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(origin.lat)) * Math.cos(toRad(destination.lat)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in km
  
  // Convert to estimated driving time (assuming 40 km/h average in city)
  return Math.max(5, Math.ceil(distance * 1.5)) // minimum 5 minutes
}

function toRad(value: number): number {
  return value * Math.PI / 180
}