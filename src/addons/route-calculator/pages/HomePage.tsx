'use client'

import { useState, useMemo, useEffect } from 'react'
import { PropertyInputBox } from '../components/PropertyInputBox'
import { PropertyList } from '../components/PropertyList'
import { DurationSelector } from '../components/DurationSelector'
import { PropertyCard } from '../components/PropertyCard'
import { DriveTimeConnector } from '../components/DriveTimeConnector'
import { RouteSummary } from '../components/RouteSummary'
import { CopyButtons } from '../components/CopyButtons'
import { StateManager } from '../components/StateManager'
import { Toast, ToastType } from '../components/Toast'
import { isDuplicateAddress } from '../utils/addressNormalizer'
import { calculateRoute } from '../server-functions/calculateRoute'
import type { OptimizedRoute, PropertyInput } from '../types'
import { useRouteManager, calculateAppointmentTimes } from '../hooks/useRouteManager'

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
    addresses: string
    startingPropertyIndex: number
    startTime: string
    selectedDuration: number
    calculatedRoute: OptimizedRoute | null
  }) => {
    // Convert old addresses format to new property list format
    const addresses = restoredState.addresses.split('\n').filter(a => a.trim())
    const convertedPropertyList: PropertyInput[] = addresses.map(address => ({
      id: crypto.randomUUID(),
      rawInput: address,
      parsedAddress: address,
      sourceUrl: undefined
    }))
    setPropertyList(convertedPropertyList)
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
      // TODO: Show error message to user
    } finally {
      setIsCalculating(false)
    }
  }
  
  // Convert propertyList to addresses string for StateManager compatibility
  const addressesString = useMemo(() => {
    return propertyList.map(p => p.parsedAddress).join('\n')
  }, [propertyList])

  return (
    <div className="app-container">
      <StateManager
        addresses={addressesString}
        startingPropertyIndex={startingPropertyIndex}
        startTime={startTime}
        selectedDuration={selectedDuration}
        calculatedRoute={calculatedRoute}
        onStateRestore={handleStateRestore}
        onClearRoute={handleClearRoute}
      />

      <header className="app-header">
        <h1 className="app-title">ROUTE CALCULATOR</h1>
        <p className="app-subtitle">Real Estate Showing Planner</p>
      </header>

      <main className="main-content">
        <section className="input-section glass-card">
          <h2 className="section-title">PROPERTY ADDRESSES</h2>

          <PropertyInputBox onAdd={handleAddProperty} />

          <PropertyList
            properties={propertyList}
            onEdit={handleEditProperty}
            onDelete={handleDeleteProperty}
            onClearAll={handleClearAll}
          />

          <div className="starting-point-container">
            <label htmlFor="starting-point" className="input-label">STARTING POINT (First Address Auto-Selected)</label>
            <select
              id="starting-point"
              className="starting-point-dropdown"
              value={startingPropertyIndex}
              onChange={(e) => {
                setStartingPropertyIndex(Number(e.target.value))
                resetSuccessState()
              }}
            >
              {propertyList.length === 0 ? (
                <option value={0}>First property (auto-selected)</option>
              ) : (
                propertyList.map((property, index) => (
                  <option key={property.id} value={index}>
                    {index + 1}. {property.parsedAddress.length > 40 ? property.parsedAddress.substring(0, 40) + '...' : property.parsedAddress}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="start-time-container">
            <label htmlFor="start-time" className="input-label">START TIME *</label>
            <input
              type="time"
              id="start-time"
              className="time-input"
              value={startTime}
              required
              onChange={(e) => {
                setStartTime(e.target.value)
                resetSuccessState()
              }}
            />
          </div>

          <DurationSelector 
            selectedDuration={selectedDuration} 
            onChange={(newDuration) => {
              setSelectedDuration(newDuration)
              resetSuccessState()
            }} 
          />

          <button 
            className={`calculate-btn ${showCalculateSuccess ? 'btn-success' : ''}`}
            onClick={handleCalculateRoute}
            disabled={isCalculating}
          >
            <span className={`btn-text ${isCalculating || showCalculateSuccess ? 'hidden' : ''}`}>CALCULATE ROUTE</span>
            <span className={`btn-loader ${isCalculating ? '' : 'hidden'}`}>CALCULATING...</span>
            <span className={`btn-success ${showCalculateSuccess ? '' : 'hidden'}`}>✓ RESULTS BELOW</span>
          </button>
        </section>

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

        </section>
        )}
      </main>

      <div className="status-container">
        <div className="status-message hidden" id="status-message"></div>
      </div>

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
    </div>
  )
}