import HomePage from './HomePage'
import { getUserCredits } from '../server-functions/getUserCredits'
import { getRoutes } from '../server-functions/routePersistence'

/**
 * Server component wrapper for HomePage
 * Fetches initial data server-side during route render
 * Passes data as props to client component
 */
export default async function HomePageWrapper() {
  // Fetch data in parallel during server render
  const [creditsData, savedRoutes] = await Promise.all([
    getUserCredits(),
    getRoutes().catch(() => []), // Graceful fallback for routes
  ])

  return (
    <HomePage
      initialCredits={creditsData}
      initialSavedRoutes={savedRoutes}
    />
  )
}
