import { useState, useMemo } from 'react'
import type { PropertyInput } from '../types'

interface UsePropertyListOptions {
  onDirtyChange: (isDirty: boolean) => void
  onResetSuccessState: () => void
  startingPropertyIndex: number
  onStartingPropertyIndexChange: (index: number) => void
}

export function usePropertyList({
  onDirtyChange,
  onResetSuccessState,
  startingPropertyIndex,
  onStartingPropertyIndexChange
}: UsePropertyListOptions) {
  const [propertyList, setPropertyList] = useState<PropertyInput[]>([])
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Extract memoized lists
  const addressList = useMemo(() => {
    return propertyList.map(prop => prop.parsedAddress)
  }, [propertyList])

  const sourceUrlList = useMemo(() => {
    return propertyList.map(prop => prop.sourceUrl)
  }, [propertyList])

  const thumbnailUrlList = useMemo(() => {
    return propertyList.map(prop => prop.thumbnailUrl)
  }, [propertyList])

  const handleAddProperty = (property: PropertyInput) => {
    setPropertyList(prev => [...prev, property])
    onDirtyChange(true)
    onResetSuccessState()
  }

  const handleEditProperty = (id: string, newAddress: string) => {
    setPropertyList(prev =>
      prev.map(prop =>
        prop.id === id ? { ...prop, parsedAddress: newAddress } : prop
      )
    )
    onDirtyChange(true)
    onResetSuccessState()
  }

  const handleDeleteProperty = (id: string) => {
    const deletedIndex = propertyList.findIndex(prop => prop.id === id)

    setPropertyList(prev => prev.filter(prop => prop.id !== id))

    // Reset starting property index to 0 if the selected property was deleted
    if (deletedIndex === startingPropertyIndex) {
      onStartingPropertyIndexChange(0)
    } else if (deletedIndex < startingPropertyIndex) {
      // Adjust index if a property before the selected one was deleted
      onStartingPropertyIndexChange(startingPropertyIndex - 1)
    }

    onDirtyChange(true)
    onResetSuccessState()
  }

  const handleRequestClearAll = () => {
    if (propertyList.length === 0) return

    // Show confirmation for 3+ items
    if (propertyList.length >= 3) {
      setShowClearConfirm(true)
    } else {
      // Clear immediately if less than 3 items
      setPropertyList([])
      onDirtyChange(true)
      onResetSuccessState()
    }
  }

  const handleConfirmClearAll = () => {
    setPropertyList([])
    setShowClearConfirm(false)
    onDirtyChange(true)
    onResetSuccessState()
  }

  const handleCancelClearAll = () => {
    setShowClearConfirm(false)
  }

  return {
    propertyList,
    setPropertyList,
    addressList,
    sourceUrlList,
    thumbnailUrlList,
    showClearConfirm,
    handleAddProperty,
    handleEditProperty,
    handleDeleteProperty,
    handleRequestClearAll,
    handleConfirmClearAll,
    handleCancelClearAll
  }
}
