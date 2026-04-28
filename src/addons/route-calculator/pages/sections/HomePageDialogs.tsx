'use client'

import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorModal } from '../../components/ErrorModal'
import { SaveRouteDialog } from '../../components/SaveRouteDialog'
import type { usePropertyList } from '../../hooks/usePropertyList'
import type { useRouteCalculation } from '../../hooks/useRouteCalculation'
import type { useRoutePersistence } from '../../hooks/useRoutePersistence'
import type { OptimizedRoute } from '../../types'

interface HomePageDialogsProps {
  routeName: string
  setRouteName: (name: string) => void
  startTime: string
  calculatedRoute: OptimizedRoute | null
  showDiscardConfirm: boolean
  setShowDiscardConfirm: (b: boolean) => void
  handleConfirmNewRoute: () => void
  propertyList: ReturnType<typeof usePropertyList>
  routeCalculation: ReturnType<typeof useRouteCalculation>
  routePersistence: ReturnType<typeof useRoutePersistence>
}

export default function HomePageDialogs({
  routeName, setRouteName, startTime, calculatedRoute,
  showDiscardConfirm, setShowDiscardConfirm, handleConfirmNewRoute,
  propertyList, routeCalculation, routePersistence,
}: HomePageDialogsProps) {
  return (
    <>
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

      <ErrorModal
        isOpen={routeCalculation.showErrorModal}
        errorMessage={routeCalculation.calculationError || 'Unknown error'}
        onClose={routeCalculation.handleCloseErrorModal}
        onRetry={routeCalculation.handleRetryCalculation}
      />

      <ConfirmDialog
        isOpen={propertyList.showClearConfirm}
        title="CLEAR ALL PROPERTIES?"
        message={`Are you sure you want to clear all ${propertyList.propertyList.length} properties? This cannot be undone.`}
        confirmText="CLEAR ALL"
        cancelText="CANCEL"
        variant="danger"
        onConfirm={propertyList.handleConfirmClearAll}
        onCancel={propertyList.handleCancelClearAll}
      />

      <ConfirmDialog
        isOpen={!!routePersistence.routeToDelete}
        title="DELETE ROUTE?"
        message="Are you sure you want to delete this route? This cannot be undone."
        confirmText="DELETE"
        cancelText="CANCEL"
        variant="danger"
        isLoading={routePersistence.isDeleting}
        onConfirm={routePersistence.handleConfirmDelete}
        onCancel={routePersistence.handleCancelDelete}
      />

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="DISCARD CHANGES?"
        message="You have unsaved changes. Discard and create new route?"
        confirmText="DISCARD"
        cancelText="CANCEL"
        variant="warning"
        onConfirm={handleConfirmNewRoute}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  )
}
