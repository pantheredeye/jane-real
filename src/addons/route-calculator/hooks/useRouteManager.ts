'use client'

import { useState, useCallback } from 'react'
import { addMinutes, parse } from 'date-fns'
import type { OptimizedRoute, RouteItem, RouteStructure } from '../types'

// Helper function to calculate appointment times from route structure and start time
export function calculateAppointmentTimes(routeStructure: RouteStructure, startTime: string): OptimizedRoute {
  // Parse start time in local timezone
  const [hours, minutes] = startTime.split(':').map(Number)
  const currentDate = new Date()
  currentDate.setHours(hours, minutes, 0, 0)

  let currentTime = currentDate

  const routeItems: RouteItem[] = routeStructure.items.map((item, index) => {
    // Add travel time if not the first property
    if (index > 0) {
      currentTime = addMinutes(currentTime, item.travelTime)
    }

    const appointmentTime = new Date(currentTime)

    // Move to next appointment (add showing duration)
    currentTime = addMinutes(appointmentTime, item.property.showingDuration)

    return {
      propertyIndex: item.propertyIndex,
      property: {
        ...item.property,
        appointmentTime,
      },
      appointmentTime,
      travelTime: item.travelTime,
    }
  })

  // Calculate totals
  const totalDrivingTime = routeStructure.totalDrivingTime
  const totalShowingTime = routeItems.reduce((sum, item) => sum + item.property.showingDuration, 0)
  const totalTime = totalDrivingTime + totalShowingTime

  const startTimeDate = routeItems[0]?.appointmentTime || currentDate
  const lastItem = routeItems[routeItems.length - 1]
  const endTime = lastItem
    ? addMinutes(lastItem.appointmentTime, lastItem.property.showingDuration)
    : startTimeDate

  return {
    items: routeItems,
    totalTime,
    totalDrivingTime,
    totalShowingTime,
    startTime: startTimeDate,
    endTime,
  }
}

export function useRouteManager(initialRoute: OptimizedRoute | null) {
  const [route, setRoute] = useState<OptimizedRoute | null>(initialRoute)

  const updateAppointmentTime = useCallback((propertyIndex: number, newTime: string) => {
    if (!route) return

    setRoute(currentRoute => {
      if (!currentRoute) return currentRoute
      const updatedItems = [...currentRoute.items]
      
      // Parse the new time and set it for the changed property
      const [hours, minutes] = newTime.split(':').map(Number)
      const newAppointmentTime = new Date(updatedItems[propertyIndex].appointmentTime)
      newAppointmentTime.setHours(hours, minutes, 0, 0)
      
      updatedItems[propertyIndex] = {
        ...updatedItems[propertyIndex],
        appointmentTime: newAppointmentTime,
        property: {
          ...updatedItems[propertyIndex].property,
          appointmentTime: newAppointmentTime
        }
      }

      // Cascade to subsequent appointments (skip frozen ones)
      for (let i = propertyIndex + 1; i < updatedItems.length; i++) {
        const currentItem = updatedItems[i]
        
        // Skip if this appointment is frozen
        if (currentItem.property.isFrozen) continue
        
        // Calculate new time based on previous appointment end + travel time
        const prevItem = updatedItems[i - 1]
        const prevEndTime = addMinutes(prevItem.appointmentTime, prevItem.property.showingDuration)
        const cascadedTime = addMinutes(prevEndTime, currentItem.travelTime)
        
        updatedItems[i] = {
          ...currentItem,
          appointmentTime: cascadedTime,
          property: {
            ...currentItem.property,
            appointmentTime: cascadedTime
          }
        }
      }

      // Recalculate route totals
      return recalculateRouteTotals({ ...currentRoute, items: updatedItems })
    })
  }, [route])

  const updateShowingDuration = useCallback((propertyIndex: number, newDuration: number) => {
    if (!route) return

    setRoute(currentRoute => {
      if (!currentRoute) return currentRoute
      const updatedItems = [...currentRoute.items]
      
      // Update the duration for the changed property
      updatedItems[propertyIndex] = {
        ...updatedItems[propertyIndex],
        property: {
          ...updatedItems[propertyIndex].property,
          showingDuration: newDuration
        }
      }

      // Cascade to subsequent appointments (skip frozen ones)
      for (let i = propertyIndex + 1; i < updatedItems.length; i++) {
        const currentItem = updatedItems[i]
        
        // Skip if this appointment is frozen
        if (currentItem.property.isFrozen) continue
        
        // Calculate new time based on updated previous appointment end + travel time
        const prevItem = updatedItems[i - 1]
        const prevEndTime = addMinutes(prevItem.appointmentTime, prevItem.property.showingDuration)
        const cascadedTime = addMinutes(prevEndTime, currentItem.travelTime)
        
        updatedItems[i] = {
          ...currentItem,
          appointmentTime: cascadedTime,
          property: {
            ...currentItem.property,
            appointmentTime: cascadedTime
          }
        }
      }

      // Recalculate route totals
      return recalculateRouteTotals({ ...currentRoute, items: updatedItems })
    })
  }, [route])

  const toggleFreezeAppointment = useCallback((propertyIndex: number) => {
    if (!route) return

    setRoute(currentRoute => {
      if (!currentRoute) return currentRoute
      const updatedItems = [...currentRoute.items]
      const currentItem = updatedItems[propertyIndex]
      
      updatedItems[propertyIndex] = {
        ...currentItem,
        property: {
          ...currentItem.property,
          isFrozen: !currentItem.property.isFrozen
        }
      }

      return { ...currentRoute, items: updatedItems }
    })
  }, [route])

  const setInitialRoute = useCallback((newRoute: OptimizedRoute | null) => {
    setRoute(newRoute)
  }, [])

  return {
    route,
    updateAppointmentTime,
    updateShowingDuration,
    toggleFreezeAppointment,
    setInitialRoute
  }
}

// Helper function to recalculate route totals after changes
function recalculateRouteTotals(route: OptimizedRoute): OptimizedRoute {
  const totalDrivingTime = route.items.reduce((sum, item) => sum + item.travelTime, 0)
  const totalShowingTime = route.items.reduce((sum, item) => sum + item.property.showingDuration, 0)
  const totalTime = totalDrivingTime + totalShowingTime
  
  const startTime = route.items[0]?.appointmentTime || route.startTime
  const lastItem = route.items[route.items.length - 1]
  const endTime = lastItem ? 
    addMinutes(lastItem.appointmentTime, lastItem.property.showingDuration) : 
    startTime

  return {
    ...route,
    totalTime,
    totalDrivingTime,
    totalShowingTime,
    startTime,
    endTime
  }
}