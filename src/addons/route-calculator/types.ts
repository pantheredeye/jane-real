import { z } from 'zod'

// Core data types
export interface Property {
  id: string
  address: string
  showingDuration: number
  appointmentTime: Date | null
  isFrozen: boolean
  coordinates: Coordinates | null
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

// Request/Response types
export interface CalculateRouteRequest {
  addresses: string[]
  showingDuration: number
  startingPropertyIndex: number
  startTime?: string
  timezoneOffset?: number // Minutes difference from UTC (e.g., -300 for EST)
  frozenAppointments?: Array<{
    propertyIndex: number
    appointmentTime: string
  }>
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
  showingDuration: z.number().min(5).max(120),
  startingPropertyIndex: z.number().min(0),
  startTime: z.string().optional(),
  timezoneOffset: z.number().optional(),
  frozenAppointments: z.array(z.object({
    propertyIndex: z.number(),
    appointmentTime: z.string(),
  })).optional(),
})


// Utility types
export type ExportFormat = 'client' | 'detailed'

export interface RouteCalculatorConfig {
  googleMapsApiKey: string
  defaultShowingDuration: number
  maxProperties: number
  defaultStartTime: string
}