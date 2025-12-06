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

  const handleDeleteRoute = async (routeId: string) => {
    if (!confirm('Are you sure you want to delete this route?')) return

    try {
      await deleteRoute(routeId)
      await loadSavedRoutes()
    } catch (error) {
      console.error('Failed to delete route:', error)
    }
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
    loadSavedRoutes,
    handleSaveRoute,
    handleDeleteRoute,
    handleSaveRouteFromMenu
  }
}
