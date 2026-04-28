'use client'

import { AppShell } from '../components/AppShell'
import { StateManager } from '../components/StateManager'
import { SavedRoutesSection } from '../components/SavedRoutesSection'
import { type UserCreditsData } from '../server-functions/getUserCredits'
import type { SavedRoute } from '../types'
import DemoImportBanner from './sections/DemoImportBanner'
import HomePageDialogs from './sections/HomePageDialogs'
import RoutePlannerSection from './sections/RoutePlannerSection'
import RouteResultsSection from './sections/RouteResultsSection'
import { useHomePageState } from './sections/useHomePageState'

interface HomePageProps { initialCredits: UserCreditsData | null; initialSavedRoutes: SavedRoute[] }

export default function HomePage(props: HomePageProps) {
  const s = useHomePageState(props)

  return (
    <AppShell
      properties={s.propertyList.propertyList}
      onClearAll={s.propertyList.handleRequestClearAll}
      onCalculate={s.routeCalculation.handleCalculateRoute}
      onPaste={s.handlePaste}
      isCalculating={s.routeCalculation.isCalculating}
      showSuccess={s.routeCalculation.showCalculateSuccess}
      isCalculationDirty={s.isCalculationDirty}
      routeName={s.routeName}
      onRouteNameChange={(name) => { s.setRouteName(name); s.setIsDirty(true) }}
      isDirty={s.isDirty}
      onNewRoute={s.handleRequestNewRoute}
      onOpenRoute={s.handleOpenRoute}
      onSaveRoute={() => s.routePersistence.handleSaveRouteFromMenu(s.calculatedRoute)}
      hasCalculatedRoute={!!s.calculatedRoute}
      creditsRemaining={s.userCredits?.creditsRemaining} isGrandfathered={s.userCredits?.isGrandfathered} isSubscribed={s.userCredits?.isSubscribed}
    >
      <StateManager
        propertyList={s.propertyList.propertyList} startTime={s.startTime}
        selectedDuration={s.selectedDuration} calculatedRoute={s.calculatedRoute}
        routeName={s.routeName} onStateRestore={s.handleStateRestore} onClearRoute={s.handleClearRoute}
      />
      <DemoImportBanner demoImport={s.demoImport} />
      <RoutePlannerSection
        propertyList={s.propertyList}
        startLocation={s.startLocation}
        routeCalculation={s.routeCalculation}
        startTime={s.startTime}
        setStartTime={s.setStartTime}
        selectedDuration={s.selectedDuration}
        setSelectedDuration={s.setSelectedDuration}
        setIsDirty={s.setIsDirty}
        calculatedRoute={s.calculatedRoute}
      />
      <RouteResultsSection
        calculatedRoute={s.calculatedRoute}
        startLocation={s.startLocation}
        properties={s.propertyList.propertyList}
        updateAppointmentTime={s.updateAppointmentTime}
        updateShowingDuration={s.updateShowingDuration}
        toggleFreezeAppointment={s.toggleFreezeAppointment}
      />
      <SavedRoutesSection
        savedRoutes={s.routePersistence.savedRoutes} isLoadingRoutes={s.routePersistence.isLoadingRoutes}
        onDeleteRoute={s.routePersistence.handleRequestDeleteRoute}
      />
      <HomePageDialogs
        routeName={s.routeName}
        setRouteName={s.setRouteName}
        startTime={s.startTime}
        calculatedRoute={s.calculatedRoute}
        showDiscardConfirm={s.showDiscardConfirm}
        setShowDiscardConfirm={s.setShowDiscardConfirm}
        handleConfirmNewRoute={s.handleConfirmNewRoute}
        propertyList={s.propertyList}
        routeCalculation={s.routeCalculation}
        routePersistence={s.routePersistence}
      />
    </AppShell>
  )
}
