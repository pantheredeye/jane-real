'use client'

import { useState, useMemo } from 'react'
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
import { RouteOptionsCard } from '../components/RouteOptionsCard'
import { ErrorModal } from '../components/ErrorModal'
import { SaveRouteDialog } from '../components/SaveRouteDialog'
import { SavedRoutesSection } from '../components/SavedRoutesSection'
import '../mobile-layout.css'
import { getUserCredits, type UserCreditsData } from '../server-functions/getUserCredits'
import type { OptimizedRoute, PropertyInput, SavedRoute } from '../types'
import { useRouteManager } from '../hooks/useRouteManager'
import { usePropertyList } from '../hooks/usePropertyList'
import { useRouteCalculation } from '../hooks/useRouteCalculation'
import { useRoutePersistence } from '../hooks/useRoutePersistence'
import { useDemoImport } from '../hooks/useDemoImport'
import { useStartLocation } from '../hooks/useStartLocation'
import { parsePropertyInput, validatePropertyInput } from '../utils/parsePropertyInput'
import { fetchOgImage } from '../server-functions/fetchOgImage'

interface HomePageProps {
  initialCredits: UserCreditsData | null
  initialSavedRoutes: SavedRoute[]
}

export default function HomePage({ initialCredits, initialSavedRoutes }: HomePageProps) {
  const [startTime, setStartTime] = useState('09:00')
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [routeName, setRouteName] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [lastCalculatedFingerprint, setLastCalculatedFingerprint] = useState('')
  const [userCredits, setUserCredits] = useState<UserCreditsData | null>(initialCredits)

  const {
    route: calculatedRoute,
    updateAppointmentTime,
    updateShowingDuration,
    toggleFreezeAppointment,
    setInitialRoute
  } = useRouteManager(null)

  // Start location hook
  const startLocation = useStartLocation({
    onDirtyChange: setIsDirty
  })

  // Property list hook
  const propertyList = usePropertyList({
    onDirtyChange: setIsDirty,
    onResetSuccessState: () => routeCalculation.resetSuccessState(),
    startingPropertyIndex: startLocation.startingPropertyIndex,
    onStartingPropertyIndexChange: startLocation.setStartingPropertyIndex
  })

  // Fetch user credits
  const fetchUserCredits = async () => {
    const credits = await getUserCredits()
    setUserCredits(credits)
  }

  // Calculate state fingerprint for dirty tracking
  const calculateStateFingerprint = () => {
    const propertyFingerprint = propertyList.propertyList
      .map(p => `${p.id}:${p.parsedAddress}`)
      .sort()
      .join('|')
    return `${propertyFingerprint}|${startTime}|${selectedDuration}|${startLocation.startFromType}|${startLocation.customStartAddress}`
  }

  const currentFingerprint = calculateStateFingerprint()

  // Route calculation hook
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
    fetchUserCredits
  })

  // Route persistence hook
  const routePersistence = useRoutePersistence({
    initialSavedRoutes
  })

  // Demo import hook
  const demoImport = useDemoImport((properties) => {
    propertyList.setPropertyList(properties)
  })

  // Handle state restoration from localStorage
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
    if (restoredState.calculatedRoute) {
      setInitialRoute(restoredState.calculatedRoute)
    }
    // Don't mark as dirty on restore - this is saved state
    setIsDirty(false)
  }

  // Handle clearing route when inputs change significantly
  const handleClearRoute = () => {
    setInitialRoute(null)
    routeCalculation.resetSuccessState()
  }

  // Route management handlers
  const handleNewRoute = () => {
    if (isDirty && propertyList.propertyList.length > 0) {
      const confirmed = window.confirm('You have unsaved changes. Discard and create new route?')
      if (!confirmed) return
    }

    propertyList.setPropertyList([])
    setRouteName('')
    setStartTime('09:00')
    setSelectedDuration(30)
    setInitialRoute(null)
    setIsDirty(false)
    localStorage.removeItem('routeCalculatorState')
  }

  const handleOpenRoute = () => {
    // TODO: Implement route loading from DB
  }

  const handlePaste = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      // Read clipboard
      const text = await navigator.clipboard.readText()

      // Check if clipboard is empty
      if (!text || text.trim().length === 0) {
        return { success: false, error: 'Clipboard is empty' }
      }

      // Validate input
      if (!validatePropertyInput(text)) {
        return { success: false, error: 'Invalid address or URL format' }
      }

      // Parse property
      const property = parsePropertyInput(text)

      // Fetch thumbnail if URL
      if (property.sourceUrl) {
        try {
          const ogData = await fetchOgImage(property.sourceUrl)
          property.thumbnailUrl = ogData.thumbnailUrl || undefined
        } catch (err) {
          console.error('Failed to fetch thumbnail:', err)
          // Continue without thumbnail - not a critical failure
        }
      }

      // Add to list
      propertyList.handleAddProperty(property)

      return { success: true }
    } catch (error) {
      // Handle clipboard permission denied
      if (error instanceof Error && error.name === 'NotAllowedError') {
        return { success: false, error: 'Clipboard permission denied' }
      }
      return { success: false, error: 'Failed to read clipboard' }
    }
  }

  const isCalculationDirty = !!(calculatedRoute && currentFingerprint !== lastCalculatedFingerprint)

  return (
    <AppShell
      properties={propertyList.propertyList}
      onClearAll={propertyList.handleClearAll}
      onCalculate={routeCalculation.handleCalculateRoute}
      onPaste={handlePaste}
      isCalculating={routeCalculation.isCalculating}
      showSuccess={routeCalculation.showCalculateSuccess}
      isCalculationDirty={isCalculationDirty}
      routeName={routeName}
      onRouteNameChange={(name) => {
        setRouteName(name)
        setIsDirty(true)
      }}
      isDirty={isDirty}
      onNewRoute={handleNewRoute}
      onOpenRoute={handleOpenRoute}
      onSaveRoute={() => routePersistence.handleSaveRouteFromMenu(calculatedRoute)}
      hasCalculatedRoute={!!calculatedRoute}
      creditsRemaining={userCredits?.creditsRemaining}
      isGrandfathered={userCredits?.isGrandfathered}
      isSubscribed={userCredits?.isSubscribed}
    >
      <StateManager
        propertyList={propertyList.propertyList}
        startTime={startTime}
        selectedDuration={selectedDuration}
        calculatedRoute={calculatedRoute}
        routeName={routeName}
        onStateRestore={handleStateRestore}
        onClearRoute={handleClearRoute}
      />

      {/* Demo Import Banner */}
      {demoImport.showDemoImportBanner && demoImport.demoProperties && (
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
                {demoImport.demoProperties.length} {demoImport.demoProperties.length === 1 ? 'property' : 'properties'} ready to import.
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
              onClick={demoImport.handleDismissDemoImport}
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
              onClick={demoImport.handleImportDemoProperties}
            >
              ✓ Import
            </button>
          </div>
        </div>
      )}

      {/* Inline Property Input - always visible at top */}
      <div className="inline-input-section">
        <PropertyInputBox onAdd={propertyList.handleAddProperty} />
      </div>

      {/* Property List - show when properties exist */}
      {propertyList.propertyList.length > 0 && (
        <div className="inline-list-section">
          <PropertyList
            properties={propertyList.propertyList}
            onEdit={propertyList.handleEditProperty}
            onDelete={propertyList.handleDeleteProperty}
          />
        </div>
      )}

      {/* Starting Location Card - show when properties exist */}
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
          />
        </div>
      )}

      {/* Route Options Card - show when properties exist */}
      {propertyList.propertyList.length > 0 && (
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
          />
        </div>
      )}

      {/* Empty state hint - only when no properties and no route */}
      {propertyList.propertyList.length === 0 && !calculatedRoute && (
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
                  type: startLocation.startFromType,
                  coords: startLocation.currentLocation || undefined,
                  address: startLocation.customStartAddress || undefined,
                  propertyIndex: startLocation.startingPropertyIndex
                }}
                propertyAddresses={propertyList.propertyList.map(p => p.parsedAddress)}
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
              onClick={() => routePersistence.setShowSaveDialog(true)}
              style={{ maxWidth: '300px' }}
            >
              💾 SAVE ROUTE
            </button>
          </div>

        </section>
      )}

      {/* Saved Routes Section */}
      <SavedRoutesSection
        savedRoutes={routePersistence.savedRoutes}
        isLoadingRoutes={routePersistence.isLoadingRoutes}
        onDeleteRoute={routePersistence.handleDeleteRoute}
      />

      {/* Save Route Dialog */}
      <SaveRouteDialog
        isOpen={routePersistence.showSaveDialog}
        routeName={routeName}
        routeDate={routePersistence.routeDate}
        isSaving={routePersistence.isSaving}
        onRouteNameChange={setRouteName}
        onRouteDateChange={routePersistence.setRouteDate}
        onSave={() => routePersistence.handleSaveRoute(calculatedRoute, routeName, startTime, () => setRouteName(''))}
        onClose={() => routePersistence.setShowSaveDialog(false)}
      />

      {/* Error Modal */}
      <ErrorModal
        isOpen={routeCalculation.showErrorModal}
        errorMessage={routeCalculation.calculationError || 'Unknown error'}
        onClose={routeCalculation.handleCloseErrorModal}
        onRetry={routeCalculation.handleRetryCalculation}
      />
    </AppShell>
  )
}
