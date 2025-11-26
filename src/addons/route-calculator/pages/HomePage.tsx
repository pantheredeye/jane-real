'use client'

import { useState, useMemo, useEffect } from 'react'
import { AppShell } from '../components/AppShell'
import { PropertyCard } from '../components/PropertyCard'
import { DriveTimeConnector } from '../components/DriveTimeConnector'
import { RouteSummary } from '../components/RouteSummary'
import { CopyButtons } from '../components/CopyButtons'
import { StateManager } from '../components/StateManager'
import { PropertyInputBox } from '../components/PropertyInputBox'
import { PropertyList } from '../components/PropertyList'
import { StartingLocationCard } from '../components/StartingLocationCard'
import { StartingLocationResultCard } from '../components/StartingLocationResultCard'
import '../mobile-layout.css'
import { isDuplicateAddress } from '../utils/addressNormalizer'
import { calculateRoute } from '../server-functions/calculateRoute'
import { saveRoute, getRoutes, deleteRoute } from '../server-functions/routePersistence'
import { getUserCredits, type UserCreditsData } from '../server-functions/getUserCredits'
import type { OptimizedRoute, PropertyInput } from '../types'
import { useRouteManager, calculateAppointmentTimes } from '../hooks/useRouteManager'
import { DEMO_PROPERTIES_KEY } from '@/app/pages/landing/components/demo/DemoContent'

export default function HomePage() {
  // TODO: Lift DurationSelector state up to HomePage (like we did with AddressInput)
  // TODO: DurationSelector needs props: selectedDuration, onChange callback
  // TODO: Add selectedDuration state to HomePage
  // TODO: Connect calculate button to POST /calculate endpoint with: addresses, startTime, startingPropertyIndex, selectedDuration
  // TODO: For now, use simple form submission - get basic flow working first
  // TODO: Show/hide results section based on calculation state
  // TODO: Implement dynamic property card rendering
  // TODO: Add error handling and status messages
  // TODO: Add loading states during calculation
  
  const [propertyList, setPropertyList] = useState<PropertyInput[]>([])
  const [startTime, setStartTime] = useState('09:00')
  const [selectedDuration, setSelectedDuration] = useState(30)

  // Start location state
  const [startFromType, setStartFromType] = useState<'current' | 'property' | 'custom'>('property')
  const [customStartAddress, setCustomStartAddress] = useState('')
  const [startingPropertyIndex, setStartingPropertyIndex] = useState(0)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showCalculateSuccess, setShowCalculateSuccess] = useState(false)

  // Route identity
  const [routeName, setRouteName] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [lastCalculatedFingerprint, setLastCalculatedFingerprint] = useState('')

  // Credits system
  const [userCredits, setUserCredits] = useState<UserCreditsData | null>(null)

  // Route persistence state
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)
  const [savedRoutes, setSavedRoutes] = useState<any[]>([])
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)
  const [showDemoImportBanner, setShowDemoImportBanner] = useState(false)
  const [demoProperties, setDemoProperties] = useState<PropertyInput[] | null>(null)
  const {
    route: calculatedRoute,
    updateAppointmentTime,
    updateShowingDuration,
    toggleFreezeAppointment,
    setInitialRoute
  } = useRouteManager(null)

  // Extract addresses and sourceUrls for route calculation
  const addressList = useMemo(() => {
    return propertyList.map(prop => prop.parsedAddress)
  }, [propertyList])

  const sourceUrlList = useMemo(() => {
    return propertyList.map(prop => prop.sourceUrl)
  }, [propertyList])

  const thumbnailUrlList = useMemo(() => {
    return propertyList.map(prop => prop.thumbnailUrl)
  }, [propertyList])

  // Property list handlers
  const handleAddProperty = (property: PropertyInput) => {
    // Check for duplicates using robust address normalizer
    const isDuplicate = propertyList.some(
      p => isDuplicateAddress(p.parsedAddress, property.parsedAddress)
    )

    setPropertyList(prev => [...prev, property])
    setIsDirty(true)
    resetSuccessState()
  }

  const handleEditProperty = (id: string, newAddress: string) => {
    setPropertyList(prev =>
      prev.map(prop =>
        prop.id === id ? { ...prop, parsedAddress: newAddress } : prop
      )
    )
    setIsDirty(true)
    resetSuccessState()
  }

  const handleDeleteProperty = (id: string) => {
    const deletedIndex = propertyList.findIndex(prop => prop.id === id)

    setPropertyList(prev => prev.filter(prop => prop.id !== id))

    // Reset starting property index to 0 if the selected property was deleted
    if (deletedIndex === startingPropertyIndex) {
      setStartingPropertyIndex(0)
    } else if (deletedIndex < startingPropertyIndex) {
      // Adjust index if a property before the selected one was deleted
      setStartingPropertyIndex(prev => prev - 1)
    }

    setIsDirty(true)
    resetSuccessState()
  }

  const handleClearAll = () => {
    if (propertyList.length === 0) return

    // Show confirmation for 3+ items
    if (propertyList.length >= 3) {
      const confirmed = window.confirm(
        `Are you sure you want to clear all ${propertyList.length} properties?`
      )
      if (!confirmed) return
    }

    setPropertyList([])
    setIsDirty(true)
    resetSuccessState()
  }

  // Reset success state when inputs change
  const resetSuccessState = () => {
    setShowCalculateSuccess(false)
  }

  // Handle state restoration from localStorage
  const handleStateRestore = (restoredState: {
    propertyList: PropertyInput[]
    startTime: string
    selectedDuration: number
    calculatedRoute: OptimizedRoute | null
    routeName: string
  }) => {
    setPropertyList(restoredState.propertyList)
    setStartTime(restoredState.startTime)
    setSelectedDuration(restoredState.selectedDuration)
    setRouteName(restoredState.routeName)
    if (restoredState.calculatedRoute) {
      setInitialRoute(restoredState.calculatedRoute)
    }
    // Don't mark as dirty on restore - this is saved state
    setIsDirty(false)
  }

  // Handle clearing route when inputs change significantly
  const handleClearRoute = () => {
    setInitialRoute(null)
    setShowCalculateSuccess(false)
  }

  const handleCalculateRoute = async () => {
    // Validate required fields
    if (!startTime || startTime.trim() === '') {
      alert('Please set a start time before calculating route.')
      return
    }

    if (addressList.length === 0) {
      alert('Please enter at least one address.')
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
        alert('Please enter a custom starting address.')
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

    console.log('Calculating route with:', requestData)
    setIsCalculating(true)
    setShowCalculateSuccess(false) // Clear success state when starting new calculation

    try {
      // Get route structure from server (optimized order + durations)
      const routeStructure = await calculateRoute(requestData)
      console.log('Server response:', routeStructure)

      // Calculate appointment times on client using local timezone
      const routeWithTimes = calculateAppointmentTimes(routeStructure, startTime)
      console.log('Route with times:', routeWithTimes)

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
    } finally {
      setIsCalculating(false)
    }
  }

  // Load saved routes on mount
  useEffect(() => {
    loadSavedRoutes()
  }, [])

  // Fetch user credits on mount
  useEffect(() => {
    fetchUserCredits()
  }, [])

  const fetchUserCredits = async () => {
    const credits = await getUserCredits()
    setUserCredits(credits)
  }

  // Check for demo properties on mount
  useEffect(() => {
    const storedDemo = localStorage.getItem(DEMO_PROPERTIES_KEY)
    if (storedDemo) {
      try {
        const parsedProperties = JSON.parse(storedDemo) as PropertyInput[]
        // Filter out example addresses - only import user-entered addresses
        const realProperties = parsedProperties.filter(prop => !prop.isExample)
        if (realProperties.length > 0) {
          setDemoProperties(realProperties)
          setShowDemoImportBanner(true)
        } else {
          // Only had example addresses, clear them
          localStorage.removeItem(DEMO_PROPERTIES_KEY)
        }
      } catch (error) {
        console.error('Failed to parse demo properties:', error)
        // Clear invalid data
        localStorage.removeItem(DEMO_PROPERTIES_KEY)
      }
    }
  }, [])

  const loadSavedRoutes = async () => {
    setIsLoadingRoutes(true)
    try {
      const routes = await getRoutes()
      setSavedRoutes(routes)
    } catch (error) {
      console.error('Failed to load saved routes:', error)
    } finally {
      setIsLoadingRoutes(false)
    }
  }

  const handleSaveRoute = async () => {
    if (!calculatedRoute || !routeName.trim()) {
      return
    }

    setIsSaving(true)
    try {
      await saveRoute({
        name: routeName,
        date: new Date(routeDate),
        startTime,
        properties: calculatedRoute.items.map(item => item.property),
        optimized: true,
        frozen: Object.fromEntries(
          calculatedRoute.items
            .filter(item => item.property.isFrozen)
            .map((item, idx) => [idx, item.appointmentTime.toISOString()])
        )
      })

      setShowSaveDialog(false)
      setRouteName('')
      await loadSavedRoutes() // Reload list
    } catch (error) {
      console.error('Failed to save route:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return

    try {
      await deleteRoute(routeId)
      await loadSavedRoutes()
    } catch (error) {
      console.error('Failed to delete route:', error)
    }
  }

  const handleImportDemoProperties = () => {
    if (demoProperties) {
      setPropertyList(demoProperties)
      setShowDemoImportBanner(false)
      localStorage.removeItem(DEMO_PROPERTIES_KEY)
    }
  }

  const handleDismissDemoImport = () => {
    setShowDemoImportBanner(false)
    localStorage.removeItem(DEMO_PROPERTIES_KEY)
  }

  // Geolocation handler
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

  // Route management handlers
  const handleNewRoute = () => {
    // TODO: Prompt to save if dirty
    if (isDirty && propertyList.length > 0) {
      const confirmed = window.confirm('You have unsaved changes. Discard and create new route?')
      if (!confirmed) return
    }

    setPropertyList([])
    setRouteName('')
    setStartTime('09:00')
    setSelectedDuration(30)
    setInitialRoute(null)
    setIsDirty(false)
    localStorage.removeItem('routeCalculatorState')
  }

  const handleOpenRoute = () => {
    // TODO: Implement route loading from DB
    // TODO: Schema needs: Route model with properties, settings, user relationship
  }

  const handleSaveRouteFromMenu = () => {
    if (!calculatedRoute) {
      return
    }
    setShowSaveDialog(true)
  }

  // Calculate state fingerprint for dirty tracking
  const calculateStateFingerprint = () => {
    const propertyFingerprint = propertyList
      .map(p => `${p.id}:${p.parsedAddress}`)
      .sort()
      .join('|')
    return `${propertyFingerprint}|${startTime}|${selectedDuration}|${startFromType}|${customStartAddress}`
  }

  const currentFingerprint = calculateStateFingerprint()
  const isCalculationDirty = !!(calculatedRoute && currentFingerprint !== lastCalculatedFingerprint)

  return (
    <AppShell
      properties={propertyList}
      onClearAll={handleClearAll}
      startTime={startTime}
      onStartTimeChange={(time) => {
        setStartTime(time)
        setIsDirty(true)
        resetSuccessState()
      }}
      selectedDuration={selectedDuration}
      onDurationChange={(duration) => {
        setSelectedDuration(duration)
        setIsDirty(true)
        resetSuccessState()
      }}
      onCalculate={handleCalculateRoute}
      isCalculating={isCalculating}
      showSuccess={showCalculateSuccess}
      isCalculationDirty={isCalculationDirty}
      routeName={routeName}
      onRouteNameChange={(name) => {
        setRouteName(name)
        setIsDirty(true)
      }}
      isDirty={isDirty}
      onNewRoute={handleNewRoute}
      onOpenRoute={handleOpenRoute}
      onSaveRoute={handleSaveRouteFromMenu}
      hasCalculatedRoute={!!calculatedRoute}
      creditsRemaining={userCredits?.creditsRemaining}
      isGrandfathered={userCredits?.isGrandfathered}
      isSubscribed={userCredits?.isSubscribed}
    >
      <StateManager
        propertyList={propertyList}
        startTime={startTime}
        selectedDuration={selectedDuration}
        calculatedRoute={calculatedRoute}
        routeName={routeName}
        onStateRestore={handleStateRestore}
        onClearRoute={handleClearRoute}
      />

      {/* Demo Import Banner */}
      {showDemoImportBanner && demoProperties && (
        <div
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🎉</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#60a5fa' }}>
                Continue from Demo?
              </h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', opacity: 0.9 }}>
                {demoProperties.length} {demoProperties.length === 1 ? 'property' : 'properties'} ready to import.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              className="calculate-btn"
              style={{
                backgroundColor: 'rgba(107, 114, 128, 0.3)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.8rem',
                minWidth: 'auto'
              }}
              onClick={handleDismissDemoImport}
            >
              No Thanks
            </button>
            <button
              className="calculate-btn"
              style={{
                backgroundColor: '#3b82f6',
                padding: '0.5rem 1rem',
                fontSize: '0.8rem',
                minWidth: 'auto'
              }}
              onClick={handleImportDemoProperties}
            >
              ✓ Import
            </button>
          </div>
        </div>
      )}

      {/* Inline Property Input - always visible at top */}
      <div className="inline-input-section">
        <PropertyInputBox onAdd={handleAddProperty} />
      </div>

      {/* Property List - show when properties exist */}
      {propertyList.length > 0 && (
        <div className="inline-list-section">
          <PropertyList
            properties={propertyList}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
          />
        </div>
      )}

      {/* Starting Location Card - show when properties exist */}
      {propertyList.length > 0 && (
        <div className="inline-list-section">
          <StartingLocationCard
            startFromType={startFromType}
            onStartFromTypeChange={(type) => {
              setStartFromType(type)
              setIsDirty(true)
            }}
            customStartAddress={customStartAddress}
            onCustomStartAddressChange={(address) => {
              setCustomStartAddress(address)
              setIsDirty(true)
            }}
            currentLocation={currentLocation}
            locationError={locationError}
            onRequestLocation={requestCurrentLocation}
            startingPropertyIndex={startingPropertyIndex}
            onStartingPropertyIndexChange={(index) => {
              setStartingPropertyIndex(index)
              setIsDirty(true)
            }}
            propertyAddresses={propertyList.map(p => p.parsedAddress)}
          />
        </div>
      )}

      {/* Empty state hint - only when no properties and no route */}
      {propertyList.length === 0 && !calculatedRoute && (
        <div className="viewport-empty">
          <p className="viewport-empty-text">Add properties above to build your route</p>
        </div>
      )}

      {calculatedRoute && (
        <section className="results-section">
          <h2 className="section-title">OPTIMIZED ITINERARY</h2>
          <p className="section-description">
            Review your route below. Adjust appointment times and lock specific slots as needed.
          </p>
          
          <RouteSummary 
            totalProperties={calculatedRoute.items.length}
            totalTime={`${Math.floor(calculatedRoute.totalTime / 60)}h ${calculatedRoute.totalTime % 60}m`}
            drivingTime={`${Math.floor(calculatedRoute.totalDrivingTime / 60)}h ${calculatedRoute.totalDrivingTime % 60}m`}
            addresses={calculatedRoute.items.map(item => item.property.address)}
          />

          <div className="itinerary-container">
            <div className="itinerary-list">
              {/* Starting point card */}
              <StartingLocationResultCard
                startLocation={{
                  type: startFromType,
                  coords: currentLocation || undefined,
                  address: customStartAddress || undefined,
                  propertyIndex: startingPropertyIndex
                }}
                propertyAddresses={propertyList.map(p => p.parsedAddress)}
              />

              {/* Drive time from start to first property */}
              {calculatedRoute.items.length > 0 && calculatedRoute.items[0].travelTime > 0 && (
                <DriveTimeConnector
                  travelTime={calculatedRoute.items[0].travelTime}
                />
              )}

              {calculatedRoute.items.map((item, index) => (
                <div key={item.propertyIndex}>
                  <PropertyCard
                    routeItem={item}
                    routeIndex={index}
                    onTimeChange={updateAppointmentTime}
                    onDurationChange={updateShowingDuration}
                    onToggleFreeze={toggleFreezeAppointment}
                  />
                  {/* Show drive time connector between cards */}
                  {index < calculatedRoute.items.length - 1 && (
                    <DriveTimeConnector
                      travelTime={calculatedRoute.items[index + 1].travelTime}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <CopyButtons route={calculatedRoute} />

          {/* Save Route Button */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              className="calculate-btn"
              onClick={() => setShowSaveDialog(true)}
              style={{ maxWidth: '300px' }}
            >
              💾 SAVE ROUTE
            </button>
          </div>

        </section>
        )}

        {/* Saved Routes Section */}
        {savedRoutes.length > 0 && (
          <section className="input-section glass-card" style={{ marginTop: '2rem' }}>
            <h2 className="section-title">MY SAVED ROUTES</h2>
            <p className="section-description">
              Load previously saved routes or delete them.
            </p>

            {isLoadingRoutes ? (
              <p style={{ textAlign: 'center', color: '#666' }}>Loading routes...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savedRoutes.map((route) => (
                  <div
                    key={route.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{route.name}</h3>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', opacity: 0.7 }}>
                        {new Date(route.date).toLocaleDateString()} • {route.properties.length} properties • Created by {route.createdBy.name || route.createdBy.email}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="calculate-btn"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          minWidth: 'auto'
                        }}
                        onClick={async () => {
                          // TODO: Implement load route
                        }}
                      >
                        📂 LOAD
                      </button>
                      <button
                        className="calculate-btn"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.9rem',
                          minWidth: 'auto',
                          backgroundColor: '#dc3545'
                        }}
                        onClick={() => handleDeleteRoute(route.id)}
                      >
                        🗑️ DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      {/* Save Route Dialog */}
      {showSaveDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '2rem'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="section-title" style={{ marginTop: 0 }}>SAVE ROUTE</h2>

            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="route-name" className="input-label">ROUTE NAME *</label>
              <input
                id="route-name"
                type="text"
                className="time-input"
                style={{ width: '100%' }}
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="e.g., Downtown Showings - March 15"
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="route-date" className="input-label">DATE</label>
              <input
                id="route-date"
                type="date"
                className="time-input"
                style={{ width: '100%' }}
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="calculate-btn"
                style={{
                  backgroundColor: '#6c757d',
                  minWidth: '100px'
                }}
                onClick={() => setShowSaveDialog(false)}
                disabled={isSaving}
              >
                CANCEL
              </button>
              <button
                className="calculate-btn"
                style={{ minWidth: '100px' }}
                onClick={handleSaveRoute}
                disabled={isSaving || !routeName.trim()}
              >
                {isSaving ? 'SAVING...' : 'SAVE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}