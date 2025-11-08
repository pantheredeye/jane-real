import { z } from 'zod'

// Core data types
export interface Property {
  id: string
  address: string
  showingDuration: number
  appointmentTime: Date | null
  isFrozen: boolean
  coordinates: Coordinates | null
  sourceUrl?: string // Optional URL to listing (Zillow, Redfin, etc.)
  thumbnailUrl?: string // Optional og:image URL from listing
}

// Input type for property before geocoding
export interface PropertyInput {
  id: string
  rawInput: string // Original user input (address or URL)
  parsedAddress: string // Extracted/cleaned address
  sourceUrl?: string // URL if input was a listing URL
  thumbnailUrl?: string // Optional og:image URL from listing
  isExample?: boolean // True if this is an example address (not user-entered)
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface RouteItem {
  propertyIndex: number
  property: Property
  appointmentTime: Date
  travelTime: number
}

export interface OptimizedRoute {
  items: RouteItem[]
  totalTime: number
  totalDrivingTime: number
  totalShowingTime: number
  startTime: Date
  endTime: Date
}

// Server response type - no appointment times, only structure and durations
export interface RouteStructure {
  items: {
    propertyIndex: number
    property: Omit<Property, 'appointmentTime'> & { appointmentTime: null }
    travelTime: number // Duration in minutes from previous property
  }[]
  totalDrivingTime: number
}

// Request/Response types
export interface CalculateRouteRequest {
  addresses: string[]
  sourceUrls?: (string | undefined)[] // Optional URLs corresponding to each address
  thumbnailUrls?: (string | undefined)[] // Optional thumbnail URLs corresponding to each address
  showingDuration: number
  startingPropertyIndex: number
}

export interface CalculateRouteResponse {
  success: boolean
  route?: OptimizedRoute
  error?: string
}

export interface ExportRequest {
  format: 'client' | 'detailed'
  route: OptimizedRoute
}

// Google Maps API types
export interface GeocodingResult {
  address: string
  coordinates: Coordinates | null
  formattedAddress: string
}

export interface DistanceMatrixResult {
  origins: Coordinates[]
  destinations: Coordinates[]
  durations: number[][] // in minutes
  distances: number[][] // in meters
}

// Zod validation schemas
export const CalculateRouteRequestSchema = z.object({
  addresses: z.array(z.string().min(1)),
  sourceUrls: z.array(z.string().optional()).optional(),
  thumbnailUrls: z.array(z.string().optional()).optional(),
  showingDuration: z.number().min(5).max(120),
  startingPropertyIndex: z.number().min(0),
})


// Utility types
export type ExportFormat = 'client' | 'detailed'

export interface RouteCalculatorConfig {
  googleMapsApiKey: string
  defaultShowingDuration: number
  maxProperties: number
  defaultStartTime: string
}