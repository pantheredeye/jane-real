'use client'

import { useState } from 'react'
import { PropertyInputBox } from '../../components/PropertyInputBox'
import { PropertyList } from '../../components/PropertyList'
import { RouteOptionsCard } from '../../components/RouteOptionsCard'
import { StartingLocationCard } from '../../components/StartingLocationCard'
import type { usePropertyList } from '../../hooks/usePropertyList'
import type { useStartLocation } from '../../hooks/useStartLocation'
import type { useRouteCalculation } from '../../hooks/useRouteCalculation'
import type { OptimizedRoute } from '../../types'

interface RoutePlannerSectionProps {
  propertyList: ReturnType<typeof usePropertyList>
  startLocation: ReturnType<typeof useStartLocation>
  routeCalculation: ReturnType<typeof useRouteCalculation>
  startTime: string
  setStartTime: (t: string) => void
  selectedDuration: number
  setSelectedDuration: (d: number) => void
  setIsDirty: (b: boolean) => void
  calculatedRoute: OptimizedRoute | null
}

export default function RoutePlannerSection({
  propertyList, startLocation, routeCalculation,
  startTime, setStartTime, selectedDuration, setSelectedDuration,
  setIsDirty, calculatedRoute,
}: RoutePlannerSectionProps) {
  const [expandedCard, setExpandedCard] = useState<'start' | 'options' | null>(null)

  return (
    <>
      <div className="inline-input-section">
        <PropertyInputBox onAdd={propertyList.handleAddProperty} />
      </div>

      <div className="inline-list-section">
        <RouteOptionsCard
          startTime={startTime}
          onStartTimeChange={(time) => {
            setStartTime(time)
            setIsDirty(true)
            routeCalculation.resetSuccessState()
          }}
          selectedDuration={selectedDuration}
          onDurationChange={(duration) => {
            setSelectedDuration(duration)
            setIsDirty(true)
            routeCalculation.resetSuccessState()
          }}
          isExpanded={expandedCard === 'options'}
          onToggleExpanded={() => setExpandedCard(expandedCard === 'options' ? null : 'options')}
        />
      </div>

      {propertyList.propertyList.length > 0 && (
        <div className="inline-list-section">
          <PropertyList
            properties={propertyList.propertyList}
            onEdit={propertyList.handleEditProperty}
            onDelete={propertyList.handleDeleteProperty}
          />
        </div>
      )}

      {propertyList.propertyList.length > 0 && (
        <div className="inline-list-section">
          <StartingLocationCard
            startFromType={startLocation.startFromType}
            onStartFromTypeChange={startLocation.handleStartFromTypeChange}
            customStartAddress={startLocation.customStartAddress}
            onCustomStartAddressChange={startLocation.handleCustomStartAddressChange}
            currentLocation={startLocation.currentLocation}
            locationError={startLocation.locationError}
            onRequestLocation={startLocation.requestCurrentLocation}
            startingPropertyIndex={startLocation.startingPropertyIndex}
            onStartingPropertyIndexChange={startLocation.handleStartingPropertyIndexChange}
            propertyAddresses={propertyList.propertyList.map(p => p.parsedAddress)}
            customAddressError={routeCalculation.customAddressError}
            isExpanded={expandedCard === 'start'}
            onToggleExpanded={() => setExpandedCard(expandedCard === 'start' ? null : 'start')}
          />
        </div>
      )}

      {propertyList.propertyList.length >= 2 && (
        <div className="inline-list-section">
          <button
            className="btn-action btn-action-primary"
            style={{ width: '100%' }}
            onClick={routeCalculation.handleCalculateRoute}
            disabled={routeCalculation.isCalculating || propertyList.propertyList.length < 2}
          >
            {routeCalculation.isCalculating ? 'CALCULATING...' : 'CALCULATE ROUTE'}
          </button>
        </div>
      )}

      {routeCalculation.validationError && (
        <div className="inline-list-section" style={{ marginTop: '1rem' }}>
          <div className="input-error-message" role="alert">
            {routeCalculation.validationError}
          </div>
        </div>
      )}

      {propertyList.propertyList.length === 0 && !calculatedRoute && (
        <div className="viewport-empty">
          <p className="viewport-empty-text">Add properties above to build your route</p>
        </div>
      )}
    </>
  )
}
