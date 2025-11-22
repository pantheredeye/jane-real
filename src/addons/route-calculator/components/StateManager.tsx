'use client'

import { useEffect } from 'react'
import { addMinutes } from 'date-fns'
import type { OptimizedRoute, PropertyInput } from '../types'

interface StateManagerProps {
  propertyList: PropertyInput[]
  startingPropertyIndex: number
  startTime: string
  selectedDuration: number
  calculatedRoute: OptimizedRoute | null
  onStateRestore: (state: {
    propertyList: PropertyInput[]
    startingPropertyIndex: number
    startTime: string
    selectedDuration: number
    calculatedRoute: OptimizedRoute | null
  }) => void
  onClearRoute?: () => void
}

export function StateManager({
  propertyList,
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
          // Helper function to restore dates with proper timezone handling
          const restoreDate = (dateString: string): Date => {
            const restoredDate = new Date(dateString)

            // If timezone has changed since saving, adjust the date
            const savedOffset = state.timezoneOffset || 0
            const currentOffset = new Date().getTimezoneOffset()
            const offsetDiff = currentOffset - savedOffset

            // Adjust the date to maintain the same local time
            return addMinutes(restoredDate, offsetDiff)
          }

          // Restore the route with proper Date objects and timezone handling
          const restoredRoute = state.calculatedRoute ? {
            ...state.calculatedRoute,
            startTime: restoreDate(state.calculatedRoute.startTime),
            endTime: restoreDate(state.calculatedRoute.endTime),
            items: state.calculatedRoute.items.map((item: any) => ({
              ...item,
              appointmentTime: restoreDate(item.appointmentTime),
              property: {
                ...item.property,
                appointmentTime: restoreDate(item.property.appointmentTime)
              }
            }))
          } : null

          onStateRestore({
            propertyList: state.propertyList || [],
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

  // Save state whenever any route-related data changes
  useEffect(() => {
    if (propertyList.length > 0) {
      const stateToSave = {
        propertyList,
        startingPropertyIndex,
        startTime,
        selectedDuration,
        calculatedRoute,
        timezoneOffset: new Date().getTimezoneOffset(), // Save current timezone offset
        timestamp: Date.now()
      }
      localStorage.setItem('routeCalculatorState', JSON.stringify(stateToSave))
    }
  }, [propertyList, startingPropertyIndex, startTime, selectedDuration, calculatedRoute]) // Save on any changes

  // Clear route when property list changes significantly (but only if we have a current route)
  useEffect(() => {
    if (calculatedRoute && onClearRoute) {
      // Get the saved property list from when route was calculated
      try {
        const savedState = localStorage.getItem('routeCalculatorState')
        if (savedState) {
          const state = JSON.parse(savedState)
          // Compare property list lengths and IDs
          const currentIds = propertyList.map(p => p.id).sort().join(',')
          const savedIds = (state.propertyList || []).map((p: PropertyInput) => p.id).sort().join(',')

          if (currentIds !== savedIds) {
            onClearRoute()
            localStorage.removeItem('routeCalculatorState')
          }
        }
      } catch (error) {
        console.error('Error checking for property list changes:', error)
      }
    }
  }, [propertyList, calculatedRoute, onClearRoute])

  // This component doesn't render anything
  return null
}