import { useState } from 'react'

interface UseStartLocationOptions {
  onDirtyChange: (isDirty: boolean) => void
}

export function useStartLocation({ onDirtyChange }: UseStartLocationOptions) {
  const [startFromType, setStartFromType] = useState<'current' | 'property' | 'custom'>('property')
  const [customStartAddress, setCustomStartAddress] = useState('')
  const [startingPropertyIndex, setStartingPropertyIndex] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationError(null)
      },
      (error) => {
        let message = 'Failed to get location'
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location permission denied'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location unavailable'
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out'
        }
        setLocationError(message)
        // Fall back to property selector
        setStartFromType('property')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleStartFromTypeChange = (type: 'current' | 'property' | 'custom') => {
    setStartFromType(type)
    onDirtyChange(true)
  }

  const handleCustomStartAddressChange = (address: string) => {
    setCustomStartAddress(address)
    onDirtyChange(true)
  }

  const handleStartingPropertyIndexChange = (index: number) => {
    setStartingPropertyIndex(index)
    onDirtyChange(true)
  }

  return {
    startFromType,
    customStartAddress,
    startingPropertyIndex,
    currentLocation,
    locationError,
    requestCurrentLocation,
    handleStartFromTypeChange,
    handleCustomStartAddressChange,
    handleStartingPropertyIndexChange,
    setStartingPropertyIndex // Direct setter for delete adjustment in usePropertyList
  }
}
