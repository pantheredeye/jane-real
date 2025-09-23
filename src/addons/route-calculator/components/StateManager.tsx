'use client'

import { useEffect } from 'react'
import type { OptimizedRoute } from '../types'

interface StateManagerProps {
  addresses: string
  startingPropertyIndex: number
  startTime: string
  selectedDuration: number
  calculatedRoute: OptimizedRoute | null
  onStateRestore: (state: {
    addresses: string
    startingPropertyIndex: number
    startTime: string
    selectedDuration: number
    calculatedRoute: OptimizedRoute | null
  }) => void
  onClearRoute?: () => void
}

export function StateManager({
  addresses,
  startingPropertyIndex,
  startTime,
  selectedDuration,
  calculatedRoute,
  onStateRestore,
  onClearRoute
}: StateManagerProps) {

  // Restore saved state from localStorage on component mount (only once)
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('routeCalculatorState')
      if (savedState) {
        const state = JSON.parse(savedState)
        // Only restore if saved within last 24 hours (prevent stale data)
        const hoursSinceCalculation = (Date.now() - state.timestamp) / (1000 * 60 * 60)
        if (hoursSinceCalculation < 24) {
          // Restore the route with proper Date objects
          const restoredRoute = state.calculatedRoute ? {
            ...state.calculatedRoute,
            startTime: new Date(state.calculatedRoute.startTime),
            endTime: new Date(state.calculatedRoute.endTime),
            items: state.calculatedRoute.items.map((item: any) => ({
              ...item,
              appointmentTime: new Date(item.appointmentTime),
              property: {
                ...item.property,
                appointmentTime: new Date(item.property.appointmentTime)
              }
            }))
          } : null

          onStateRestore({
            addresses: state.addresses || '',
            startingPropertyIndex: state.startingPropertyIndex || 0,
            startTime: state.startTime || '09:00',
            selectedDuration: state.selectedDuration || 30,
            calculatedRoute: restoredRoute
          })
        } else {
          // Clear stale data
          localStorage.removeItem('routeCalculatorState')
        }
      }
    } catch (error) {
      console.error('Failed to restore saved state:', error)
      localStorage.removeItem('routeCalculatorState')
    }
  }, []) // Empty dependency array - only run once on mount

  // Save state only when calculatedRoute initially appears or changes
  useEffect(() => {
    if (calculatedRoute) {
      const stateToSave = {
        addresses,
        startingPropertyIndex,
        startTime,
        selectedDuration,
        calculatedRoute,
        timestamp: Date.now()
      }
      localStorage.setItem('routeCalculatorState', JSON.stringify(stateToSave))
    }
  }, [calculatedRoute]) // Only depend on calculatedRoute, not other inputs

  // Clear route when addresses change significantly (but only if we have a current route)
  useEffect(() => {
    if (calculatedRoute && onClearRoute) {
      // Get the saved addresses from when route was calculated
      try {
        const savedState = localStorage.getItem('routeCalculatorState')
        if (savedState) {
          const state = JSON.parse(savedState)
          // If current addresses are significantly different from saved ones, clear the route
          if (state.addresses !== addresses) {
            onClearRoute()
            localStorage.removeItem('routeCalculatorState')
          }
        }
      } catch (error) {
        console.error('Error checking for address changes:', error)
      }
    }
  }, [addresses, calculatedRoute, onClearRoute])

  // This component doesn't render anything
  return null
}