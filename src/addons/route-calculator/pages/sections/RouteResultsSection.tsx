'use client'

import { PropertyCard } from '../../components/PropertyCard'
import { DriveTimeConnector } from '../../components/DriveTimeConnector'
import { RouteSummary } from '../../components/RouteSummary'
import { CopyButtons } from '../../components/CopyButtons'
import { StartingLocationResultCard } from '../../components/StartingLocationResultCard'
import type { useRouteManager } from '../../hooks/useRouteManager'
import type { useStartLocation } from '../../hooks/useStartLocation'
import type { PropertyInput, OptimizedRoute } from '../../types'

type RouteManagerReturn = ReturnType<typeof useRouteManager>

interface RouteResultsSectionProps {
  calculatedRoute: OptimizedRoute | null
  startLocation: ReturnType<typeof useStartLocation>
  properties: PropertyInput[]
  updateAppointmentTime: RouteManagerReturn['updateAppointmentTime']
  updateShowingDuration: RouteManagerReturn['updateShowingDuration']
  toggleFreezeAppointment: RouteManagerReturn['toggleFreezeAppointment']
}

export default function RouteResultsSection({
  calculatedRoute, startLocation, properties,
  updateAppointmentTime, updateShowingDuration, toggleFreezeAppointment,
}: RouteResultsSectionProps) {
  if (!calculatedRoute) return null

  return (
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
        startTime={calculatedRoute.startTime}
        endTime={calculatedRoute.endTime}
      />

      <div className="itinerary-container">
        <div className="itinerary-list">
          <StartingLocationResultCard
            startLocation={{
              type: startLocation.startFromType,
              coords: startLocation.currentLocation || undefined,
              address: startLocation.customStartAddress || undefined,
              propertyIndex: startLocation.startingPropertyIndex,
            }}
            propertyAddresses={properties.map(p => p.parsedAddress)}
          />

          {calculatedRoute.items.length > 0 && calculatedRoute.items[0].travelTime > 0 && (
            <DriveTimeConnector travelTime={calculatedRoute.items[0].travelTime} />
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
              {index < calculatedRoute.items.length - 1 && (
                <DriveTimeConnector travelTime={calculatedRoute.items[index + 1].travelTime} />
              )}
            </div>
          ))}
        </div>
      </div>

      <CopyButtons route={calculatedRoute} />
    </section>
  )
}
