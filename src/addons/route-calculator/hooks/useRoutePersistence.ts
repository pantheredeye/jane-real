import { useState } from 'react'
import { saveRoute, getRoutes, deleteRoute } from '../server-functions/routePersistence'
import type { OptimizedRoute, SavedRoute } from '../types'

interface UseRoutePersistenceOptions {
  initialSavedRoutes: SavedRoute[]
}

export function useRoutePersistence({ initialSavedRoutes }: UseRoutePersistenceOptions) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0])
  const [isSaving, setIsSaving] = useState(false)
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>(initialSavedRoutes)
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)
  const [routeToDelete, setRouteToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleSaveRoute = async (
    calculatedRoute: OptimizedRoute | null,
    routeName: string,
    startTime: string,
    onSuccess?: () => void
  ) => {
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
      if (onSuccess) onSuccess()
      await loadSavedRoutes() // Reload list
    } catch (error) {
      console.error('Failed to save route:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRequestDeleteRoute = (routeId: string) => {
    setRouteToDelete(routeId)
  }

  const handleConfirmDelete = async () => {
    if (!routeToDelete) return

    setIsDeleting(true)
    try {
      await deleteRoute(routeToDelete)
      await loadSavedRoutes()
      setRouteToDelete(null)
    } catch (error) {
      // Error will be visible to user, keep dialog open
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setRouteToDelete(null)
  }

  const handleSaveRouteFromMenu = (calculatedRoute: OptimizedRoute | null) => {
    if (!calculatedRoute) {
      return
    }
    setShowSaveDialog(true)
  }

  return {
    showSaveDialog,
    setShowSaveDialog,
    routeDate,
    setRouteDate,
    isSaving,
    savedRoutes,
    isLoadingRoutes,
    routeToDelete,
    isDeleting,
    loadSavedRoutes,
    handleSaveRoute,
    handleRequestDeleteRoute,
    handleConfirmDelete,
    handleCancelDelete,
    handleSaveRouteFromMenu
  }
}
