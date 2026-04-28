'use client'

import { useEffect, useRef, useState } from 'react'
import { useDock } from '../../../agent/contexts/DockProvider'
import { useRouteManager } from '../../hooks/useRouteManager'
import { usePropertyList } from '../../hooks/usePropertyList'
import { useRouteCalculation } from '../../hooks/useRouteCalculation'
import { useRoutePersistence } from '../../hooks/useRoutePersistence'
import { useDemoImport } from '../../hooks/useDemoImport'
import { useStartLocation } from '../../hooks/useStartLocation'
import { getUserCredits, type UserCreditsData } from '../../server-functions/getUserCredits'
import { pasteFromClipboard } from '../../utils/pasteFromClipboard'
import type { OptimizedRoute, PropertyInput, SavedRoute } from '../../types'

interface UseHomePageStateOptions {
  initialCredits: UserCreditsData | null
  initialSavedRoutes: SavedRoute[]
}

export function useHomePageState({ initialCredits, initialSavedRoutes }: UseHomePageStateOptions) {
  const [startTime, setStartTime] = useState('09:00')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [routeName, setRouteName] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [lastCalculatedFingerprint, setLastCalculatedFingerprint] = useState('')
  const [userCredits, setUserCredits] = useState<UserCreditsData | null>(initialCredits)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const {
    route: calculatedRoute,
    updateAppointmentTime,
    updateShowingDuration,
    toggleFreezeAppointment,
    setInitialRoute,
  } = useRouteManager(null)

  const startLocation = useStartLocation({ onDirtyChange: setIsDirty })

  const propertyList = usePropertyList({
    onDirtyChange: setIsDirty,
    onResetSuccessState: () => routeCalculation.resetSuccessState(),
    startingPropertyIndex: startLocation.startingPropertyIndex,
    onStartingPropertyIndexChange: startLocation.setStartingPropertyIndex,
  })

  const propertyFingerprint = propertyList.propertyList
    .map(p => `${p.id}:${p.parsedAddress}`)
    .sort()
    .join('|')
  const currentFingerprint = `${propertyFingerprint}|${startTime}|${selectedDuration}|${startLocation.startFromType}|${startLocation.customStartAddress}`

  const routeCalculation = useRouteCalculation({
    startTime,
    addressList: propertyList.addressList,
    sourceUrlList: propertyList.sourceUrlList,
    thumbnailUrlList: propertyList.thumbnailUrlList,
    selectedDuration,
    startFromType: startLocation.startFromType,
    currentLocation: startLocation.currentLocation,
    customStartAddress: startLocation.customStartAddress,
    startingPropertyIndex: startLocation.startingPropertyIndex,
    setInitialRoute,
    currentFingerprint,
    setLastCalculatedFingerprint,
    fetchUserCredits: async () => setUserCredits(await getUserCredits()),
  })

  const routePersistence = useRoutePersistence({ initialSavedRoutes })

  const demoImport = useDemoImport((properties) => {
    propertyList.setPropertyList(properties)
  })

  const handleStateRestore = (restoredState: {
    propertyList: PropertyInput[]
    startTime: string
    selectedDuration: number
    calculatedRoute: OptimizedRoute | null
    routeName: string
  }) => {
    propertyList.setPropertyList(restoredState.propertyList)
    setStartTime(restoredState.startTime)
    setSelectedDuration(restoredState.selectedDuration)
    setRouteName(restoredState.routeName)
    if (restoredState.calculatedRoute) setInitialRoute(restoredState.calculatedRoute)
    setIsDirty(false)
  }

  const handleClearRoute = () => {
    setInitialRoute(null)
    routeCalculation.resetSuccessState()
  }

  const handleConfirmNewRoute = () => {
    propertyList.setPropertyList([])
    setRouteName('')
    setStartTime('09:00')
    setSelectedDuration(30)
    setInitialRoute(null)
    setIsDirty(false)
    setShowDiscardConfirm(false)
    localStorage.removeItem('routeCalculatorState')
  }

  const handleRequestNewRoute = () => {
    if (isDirty && propertyList.propertyList.length > 0) setShowDiscardConfirm(true)
    else handleConfirmNewRoute()
  }

  const handleOpenRoute = () => {
    // TODO: Implement route loading from DB
  }

  const handlePaste = () => pasteFromClipboard(propertyList.handleAddProperty)

  const isCalculationDirty = !!(calculatedRoute && currentFingerprint !== lastCalculatedFingerprint)

  const { setIntegration } = useDock()
  const handleAddPropertyRef = useRef(propertyList.handleAddProperty)
  handleAddPropertyRef.current = propertyList.handleAddProperty

  useEffect(() => {
    setIntegration({
      onAgentPropertyAdded: (property) => handleAddPropertyRef.current(property),
    })
    return () => setIntegration({})
  }, [setIntegration])

  return {
    startTime, setStartTime,
    selectedDuration, setSelectedDuration,
    routeName, setRouteName,
    isDirty, setIsDirty,
    userCredits,
    showDiscardConfirm, setShowDiscardConfirm,
    calculatedRoute, updateAppointmentTime, updateShowingDuration, toggleFreezeAppointment,
    propertyList, startLocation, routeCalculation, routePersistence, demoImport,
    isCalculationDirty,
    handleStateRestore, handleClearRoute, handleRequestNewRoute,
    handleConfirmNewRoute, handleOpenRoute, handlePaste,
  }
}

export type HomePageState = ReturnType<typeof useHomePageState>
