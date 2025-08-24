'use client'

import { useState, useMemo } from 'react'
import { AddressInput } from '../components/AddressInput'
import { DurationSelector } from '../components/DurationSelector'
import { PropertyCard } from '../components/PropertyCard'
import { RouteSummary } from '../components/RouteSummary'
import { CopyButtons } from '../components/CopyButtons'
import { calculateRoute } from '../server-functions/calculateRoute'
import type { OptimizedRoute } from '../types'

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
  
  const [addresses, setAddresses] = useState('3633 Rhett Butler Road, Hernando MS\n5210 Waikiki Cove, Hernando MS\n11147 Horseshoe Bend, Hernando MS\n2150 Scenic Hills Drive, Horn Lake MS')
  const [startingPropertyIndex, setStartingPropertyIndex] = useState(0)
  const [startTime, setStartTime] = useState('09:00')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [calculatedRoute, setCalculatedRoute] = useState<OptimizedRoute | null>(null)
  
  // Parse addresses into array and filter empty lines
  const addressList = useMemo(() => {
    return addresses
      .split('\n')
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0)
  }, [addresses])

  const handleCalculateRoute = async () => {
    // TODO: Add form validation (check addresses, startTime)
    // TODO: Add loading states
    // TODO: Add error handling
    
    const requestData = {
      addresses: addressList,
      showingDuration: selectedDuration,
      startingPropertyIndex,
      startTime: startTime || undefined
    }
    
    console.log('Calculating route with:', requestData)
    
    try {
      // Call server function directly with plain object (RedwoodSDK best practice)
      const result = await calculateRoute(requestData)
      console.log('Server response:', result)
      setCalculatedRoute(result)
      
    } catch (error) {
      console.error('Route calculation failed:', error)
      // TODO: Show error message to user
    }
  }
  
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">ROUTE CALCULATOR</h1>
        <p className="app-subtitle">Real Estate Showing Planner</p>
      </header>

      <main className="main-content">
        <section className="input-section glass-card">
          <h2 className="section-title">PROPERTY ADDRESSES</h2>
          
          <AddressInput 
            addresses={addresses} 
            onChange={setAddresses} 
          />
          
          <div className="starting-point-container">
            <label htmlFor="starting-point" className="input-label">STARTING POINT (First Address Auto-Selected)</label>
            <select 
              id="starting-point" 
              className="starting-point-dropdown"
              value={startingPropertyIndex}
              onChange={(e) => setStartingPropertyIndex(Number(e.target.value))}
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
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <DurationSelector 
            selectedDuration={selectedDuration} 
            onChange={setSelectedDuration} 
          />

          <button className="calculate-btn" onClick={handleCalculateRoute}>
            <span className="btn-text">CALCULATE ROUTE</span>
            <span className="btn-loader hidden">CALCULATING...</span>
          </button>
        </section>

        {calculatedRoute && (
        <section className="results-section">
          <h2 className="section-title">OPTIMIZED ITINERARY</h2>
          <p className="section-description">
            Review your route below. Adjust appointment times and lock specific slots as needed, then re-optimize if changes are made.
          </p>
          
          <RouteSummary 
            totalProperties={calculatedRoute.items.length}
            totalTime={`${Math.floor(calculatedRoute.totalTime / 60)}h ${calculatedRoute.totalTime % 60}m`}
            drivingTime={`${Math.floor(calculatedRoute.totalDrivingTime / 60)}h ${calculatedRoute.totalDrivingTime % 60}m`}
          />

          <div className="itinerary-container">
            <div className="itinerary-list">
              {calculatedRoute.items.map((item, index) => (
                <PropertyCard 
                  key={item.propertyIndex}
                  routeItem={item}
                  routeIndex={index}
                />
              ))}
            </div>
          </div>

          <CopyButtons />

          <div className="action-buttons">
            <button className="optimize-btn" id="re-optimize">
              RE-OPTIMIZE ROUTE
            </button>
          </div>
        </section>
        )}
      </main>

      <div className="status-container">
        <div className="status-message hidden" id="status-message"></div>
      </div>
    </div>
  )
}