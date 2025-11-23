'use client'

import { useState, useMemo, useEffect } from 'react'
import { AppShell } from '../components/AppShell'
import { PropertyCard } from '../components/PropertyCard'
import { DriveTimeConnector } from '../components/DriveTimeConnector'
import { RouteSummary } from '../components/RouteSummary'
import { CopyButtons } from '../components/CopyButtons'
import { StateManager } from '../components/StateManager'
import { Toast, ToastType } from '../components/Toast'
import '../mobile-layout.css'
import { isDuplicateAddress } from '../utils/addressNormalizer'
import { calculateRoute } from '../server-functions/calculateRoute'
import { saveRoute, getRoutes, deleteRoute } from '../server-functions/routePersistence'
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
  const [startingPropertyIndex, setStartingPropertyIndex] = useState(0)
  const [startTime, setStartTime] = useState('09:00')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [showCalculateSuccess, setShowCalculateSuccess] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  // Route persistence state
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [routeName, setRouteName] = useState('')
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

  // Handle jump button visibility based on scroll position and results availability
  useEffect(() => {
    if (!calculatedRoute) {
      setShowJumpButton(false)
      return
    }

    let scrollTimeout: NodeJS.Timeout

    const handleScroll = () => {
      // Debounce scroll events to prevent rapid toggling
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const resultsSection = document.querySelector('.results-section') as HTMLElement
        if (!resultsSection) return

        const resultsTop = resultsSection.offsetTop
        const resultsBottom = resultsTop + resultsSection.offsetHeight
        const scrollPosition = window.scrollY + window.innerHeight / 2

        // Hide button when user is in or past the results section (with buffer)
        const isInResultsArea = scrollPosition >= (resultsTop - 200)
        setShowJumpButton(!isInResultsArea)
      }, 50) // 50ms debounce
    }

    // Show button initially when results are available
    setShowJumpButton(true)
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll)
    
    // Initial check
    setTimeout(handleScroll, 200)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [calculatedRoute])

  // Property list handlers
  const handleAddProperty = (property: PropertyInput) => {
    // Check for duplicates using robust address normalizer
    const isDuplicate = propertyList.some(
      p => isDuplicateAddress(p.parsedAddress, property.parsedAddress)
    )

    if (isDuplicate) {
      setToast({
        message: 'This address is already in your list (different format detected)',
        type: 'warning'
      })
      // Still add it anyway (warn, don't block)
    }

    setPropertyList(prev => [...prev, property])

    if (!isDuplicate) {
      setToast({
        message: 'Property added!',
        type: 'success'
      })
    }

    resetSuccessState()
  }

  const handleEditProperty = (id: string, newAddress: string) => {
    setPropertyList(prev =>
      prev.map(prop =>
        prop.id === id ? { ...prop, parsedAddress: newAddress } : prop
      )
    )
    resetSuccessState()
  }

  const handleDeleteProperty = (id: string) => {
    setPropertyList(prev => prev.filter(prop => prop.id !== id))
    setToast({
      message: 'Property removed',
      type: 'info'
    })
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
    setToast({
      message: `Cleared ${propertyList.length} ${propertyList.length === 1 ? 'property' : 'properties'}`,
      type: 'info'
    })
    resetSuccessState()
  }

  // Reset success state when inputs change
  const resetSuccessState = () => {
    setShowCalculateSuccess(false)
  }

  // Handle state restoration from localStorage
  const handleStateRestore = (restoredState: {
    propertyList: PropertyInput[]
    startingPropertyIndex: number
    startTime: string
    selectedDuration: number
    calculatedRoute: OptimizedRoute | null
  }) => {
    setPropertyList(restoredState.propertyList)
    setStartingPropertyIndex(restoredState.startingPropertyIndex)
    setStartTime(restoredState.startTime)
    setSelectedDuration(restoredState.selectedDuration)
    if (restoredState.calculatedRoute) {
      setInitialRoute(restoredState.calculatedRoute)
    }
  }

  // Handle clearing route when inputs change significantly
  const handleClearRoute = () => {
    setInitialRoute(null)
    setShowCalculateSuccess(false)
  }

  const handleJumpToResults = () => {
    const resultsSection = document.querySelector('.results-section')
    if (resultsSection) {
      resultsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
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

    const requestData = {
      addresses: addressList,
      sourceUrls: sourceUrlList,
      thumbnailUrls: thumbnailUrlList,
      showingDuration: selectedDuration,
      startingPropertyIndex,
    }

    console.log('Calculating route with:', requestData)
    setIsCalculating(true)

    try {
      // Get route structure from server (optimized order + durations)
      const routeStructure = await calculateRoute(requestData)
      console.log('Server response:', routeStructure)

      // Calculate appointment times on client using local timezone
      const routeWithTimes = calculateAppointmentTimes(routeStructure, startTime)
      console.log('Route with times:', routeWithTimes)

      setInitialRoute(routeWithTimes)


      // Show success state on button
      setShowCalculateSuccess(true)
      setTimeout(() => setShowCalculateSuccess(false), 3000)

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
      setToast({
        message: 'Failed to calculate route. Please try again.',
        type: 'error'
      })
    } finally {
      setIsCalculating(false)
    }
  }

  // Load saved routes on mount
  useEffect(() => {
    loadSavedRoutes()
  }, [])

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
      setToast({ message: 'Please enter a route name', type: 'warning' })
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

      setToast({ message: 'Route saved successfully!', type: 'success' })
      setShowSaveDialog(false)
      setRouteName('')
      await loadSavedRoutes() // Reload list
    } catch (error) {
      console.error('Failed to save route:', error)
      setToast({ message: 'Failed to save route', type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return

    try {
      await deleteRoute(routeId)
      setToast({ message: 'Route deleted', type: 'success' })
      await loadSavedRoutes()
    } catch (error) {
      console.error('Failed to delete route:', error)
      setToast({ message: 'Failed to delete route', type: 'error' })
    }
  }

  const handleImportDemoProperties = () => {
    if (demoProperties) {
      setPropertyList(demoProperties)
      setToast({
        message: `Imported ${demoProperties.length} ${demoProperties.length === 1 ? 'property' : 'properties'} from demo!`,
        type: 'success'
      })
      setShowDemoImportBanner(false)
      localStorage.removeItem(DEMO_PROPERTIES_KEY)
    }
  }

  const handleDismissDemoImport = () => {
    setShowDemoImportBanner(false)
    localStorage.removeItem(DEMO_PROPERTIES_KEY)
  }

  return (
    <AppShell
      properties={propertyList}
      onAddProperty={handleAddProperty}
      onEditProperty={handleEditProperty}
      onDeleteProperty={handleDeleteProperty}
      onClearAll={handleClearAll}
      startingPropertyIndex={startingPropertyIndex}
      onStartingPropertyIndexChange={(index) => {
        setStartingPropertyIndex(index)
        resetSuccessState()
      }}
      startTime={startTime}
      onStartTimeChange={(time) => {
        setStartTime(time)
        resetSuccessState()
      }}
      selectedDuration={selectedDuration}
      onDurationChange={(duration) => {
        setSelectedDuration(duration)
        resetSuccessState()
      }}
      onCalculate={handleCalculateRoute}
      isCalculating={isCalculating}
      showSuccess={showCalculateSuccess}
    >
      <StateManager
        propertyList={propertyList}
        startingPropertyIndex={startingPropertyIndex}
        startTime={startTime}
        selectedDuration={selectedDuration}
        calculatedRoute={calculatedRoute}
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

      {/* Read-only property list display */}
      {propertyList.length === 0 ? (
        <div className="viewport-empty">
          <p className="viewport-empty-text">No properties added yet</p>
          <p className="viewport-empty-cta">Tap + ADD to get started</p>
        </div>
      ) : (
        <div className="viewport-property-list">
          {propertyList.map((property, index) => (
            <div key={property.id} className="viewport-property-item">
              <span className="viewport-property-number">{index + 1}</span>
              <span className="viewport-property-address">
                {property.parsedAddress}
              </span>
            </div>
          ))}
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
                          setToast({ message: 'Load route feature coming soon!', type: 'info' })
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
      {/* Sticky Jump to Results Button */}
      {showJumpButton && (
        <button
          className="jump-to-results-btn"
          onClick={handleJumpToResults}
          aria-label="Jump to results"
        >
          ↓ VIEW RESULTS
        </button>
      )}

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
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