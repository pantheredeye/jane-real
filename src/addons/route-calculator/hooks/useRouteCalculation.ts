import { useState, useEffect, useRef } from 'react'
import { calculateRoute } from '../server-functions/calculateRoute'
import { calculateAppointmentTimes } from './useRouteManager'
import type { OptimizedRoute } from '../types'

interface UseRouteCalculationOptions {
  startTime: string
  addressList: string[]
  sourceUrlList: (string | undefined)[]
  thumbnailUrlList: (string | undefined)[]
  selectedDuration: number
  startFromType: 'current' | 'property' | 'custom'
  currentLocation: { lat: number; lng: number } | null
  customStartAddress: string
  startingPropertyIndex: number
  setInitialRoute: (route: OptimizedRoute | null) => void
  currentFingerprint: string
  setLastCalculatedFingerprint: (fingerprint: string) => void
  fetchUserCredits: () => Promise<void>
}

export function useRouteCalculation({
  startTime,
  addressList,
  sourceUrlList,
  thumbnailUrlList,
  selectedDuration,
  startFromType,
  currentLocation,
  customStartAddress,
  startingPropertyIndex,
  setInitialRoute,
  currentFingerprint,
  setLastCalculatedFingerprint,
  fetchUserCredits
}: UseRouteCalculationOptions) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [showCalculateSuccess, setShowCalculateSuccess] = useState(false)
  const [calculationError, setCalculationError] = useState<string | null>(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [customAddressError, setCustomAddressError] = useState<string | null>(null)
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const customAddressTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-clear validation error after 5 seconds
  useEffect(() => {
    if (validationError) {
      validationTimeoutRef.current = setTimeout(() => {
        setValidationError(null)
      }, 5000)
    }
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [validationError])

  // Auto-clear custom address error after 5 seconds
  useEffect(() => {
    if (customAddressError) {
      customAddressTimeoutRef.current = setTimeout(() => {
        setCustomAddressError(null)
      }, 5000)
    }
    return () => {
      if (customAddressTimeoutRef.current) {
        clearTimeout(customAddressTimeoutRef.current)
      }
    }
  }, [customAddressError])

  const resetSuccessState = () => {
    setShowCalculateSuccess(false)
  }

  const handleCalculateRoute = async () => {
    // Validate required fields
    if (!startTime || startTime.trim() === '') {
      setValidationError('Please set a start time before calculating route.')
      return
    }

    if (addressList.length === 0) {
      setValidationError('Please enter at least one address.')
      return
    }

    // Build start location data
    let startLocation: { type: 'current' | 'property' | 'custom'; coords?: { lat: number; lng: number }; address?: string; propertyIndex?: number } = {
      type: startFromType
    }

    if (startFromType === 'current') {
      if (!currentLocation) {
        alert('Unable to get current location. Please try again or use a different start option.')
        return
      }
      startLocation.coords = currentLocation
    } else if (startFromType === 'custom') {
      if (!customStartAddress.trim()) {
        setCustomAddressError('Please enter a custom starting address.')
        return
      }
      startLocation.address = customStartAddress
    } else if (startFromType === 'property') {
      startLocation.propertyIndex = startingPropertyIndex
    }

    const requestData = {
      addresses: addressList,
      sourceUrls: sourceUrlList,
      thumbnailUrls: thumbnailUrlList,
      showingDuration: selectedDuration,
      startLocation,
    }

    setIsCalculating(true)
    setShowCalculateSuccess(false) // Clear success state when starting new calculation

    try {
      // Get route structure from server (optimized order + durations)
      const routeStructure = await calculateRoute(requestData)

      // Calculate appointment times on client using local timezone
      const routeWithTimes = calculateAppointmentTimes(routeStructure, startTime)

      setInitialRoute(routeWithTimes)
      setLastCalculatedFingerprint(currentFingerprint)

      // Show success state on button (persists until next calculation or edit)
      setShowCalculateSuccess(true)

      // Refetch credits after successful calculation (credit was consumed)
      fetchUserCredits()

      // Auto-scroll to results (subtle feedback)
      setTimeout(() => {
        const resultsSection = document.querySelector('.results-section')
        if (resultsSection) {
          resultsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)

    } catch (error) {
      console.error('Route calculation failed:', error)

      const errorMessage = error instanceof Error
        ? error.message
        : 'An unexpected error occurred during route calculation'

      setCalculationError(errorMessage)
      setShowErrorModal(true)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleCloseErrorModal = () => {
    setShowErrorModal(false)
    setCalculationError(null)
  }

  const handleRetryCalculation = () => {
    setShowErrorModal(false)
    setCalculationError(null)
    handleCalculateRoute()
  }

  return {
    isCalculating,
    showCalculateSuccess,
    calculationError,
    showErrorModal,
    validationError,
    customAddressError,
    handleCalculateRoute,
    handleCloseErrorModal,
    handleRetryCalculation,
    resetSuccessState
  }
}
