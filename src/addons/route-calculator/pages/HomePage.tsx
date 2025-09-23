'use client'

import { useState, useMemo, useEffect } from 'react'
import { AddressInput } from '../components/AddressInput'
import { DurationSelector } from '../components/DurationSelector'
import { PropertyCard } from '../components/PropertyCard'
import { RouteSummary } from '../components/RouteSummary'
import { CopyButtons } from '../components/CopyButtons'
import { StateManager } from '../components/StateManager'
import { calculateRoute } from '../server-functions/calculateRoute'
import type { OptimizedRoute } from '../types'
import { useRouteManager } from '../hooks/useRouteManager'

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
  
  const [addresses, setAddresses] = useState('')
  const [startingPropertyIndex, setStartingPropertyIndex] = useState(0)
  const [startTime, setStartTime] = useState('09:00')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [isCalculating, setIsCalculating] = useState(false)
  const [showJumpButton, setShowJumpButton] = useState(false)
  const [showCalculateSuccess, setShowCalculateSuccess] = useState(false)
  const { 
    route: calculatedRoute, 
    updateAppointmentTime, 
    updateShowingDuration, 
    toggleFreezeAppointment, 
    setInitialRoute 
  } = useRouteManager(null)
  
  // Parse addresses into array and filter empty lines
  const addressList = useMemo(() => {
    return addresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)
  }, [addresses])

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
    setAddresses(restoredState.addresses)
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
    // TODO: Add form validation (check addresses, startTime)
    // TODO: Add loading states
    // TODO: Add error handling

    const requestData = {
      addresses: addressList,
      showingDuration: selectedDuration,
      startingPropertyIndex,
      startTime: startTime || undefined,
      timezoneOffset: new Date().getTimezoneOffset() // Client's timezone offset in minutes
    }

    console.log('Calculating route with:', requestData)
    setIsCalculating(true)

    try {
      // Call server function directly with plain object (RedwoodSDK best practice)
      const result = await calculateRoute(requestData)
      console.log('Server response:', result)
      setInitialRoute(result)


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
  
  return (
    <div className="app-container">
      <StateManager
        addresses={addresses}
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
          
          <AddressInput 
            addresses={addresses} 
            onChange={(newAddresses) => {
              setAddresses(newAddresses)
              resetSuccessState()
            }} 
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
              {addressList.length === 0 ? (
                <option value={0}>First property (auto-selected)</option>
              ) : (
                addressList.map((address, index) => (
                  <option key={index} value={index}>
                    {index + 1}. {address.length > 40 ? address.substring(0, 40) + '...' : address}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="start-time-container">
            <label htmlFor="start-time" className="input-label">START TIME</label>
            <input
              type="time"
              id="start-time"
              className="time-input"
              value={startTime}
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
                <PropertyCard 
                  key={item.propertyIndex}
                  routeItem={item}
                  routeIndex={index}
                  onTimeChange={updateAppointmentTime}
                  onDurationChange={updateShowingDuration}
                  onToggleFreeze={toggleFreezeAppointment}
                />
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
    </div>
  )
}