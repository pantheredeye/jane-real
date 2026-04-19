import HomePage from './HomePage'
import { getUserCredits } from '../server-functions/getUserCredits'
import { getRoutes } from '../server-functions/routeQueries'
import { PasswordNudgeBanner } from '@/app/pages/account/PasswordNudgeBanner'
import type { AppContext } from '@/worker'

const NUDGE_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Server component wrapper for HomePage
 * Fetches initial data server-side during route render
 * Passes data as props to client component
 */
export default async function HomePageWrapper({ ctx }: { ctx: AppContext }) {
  // Fetch data in parallel during server render
  const [creditsData, savedRoutes] = await Promise.all([
    getUserCredits(),
    getRoutes().catch(() => []), // Graceful fallback for routes
  ])

  const user = ctx.user
  const showNudge =
    !!user &&
    user.passwordHash === null &&
    (!user.passwordNudgeDismissedAt ||
      Date.now() - user.passwordNudgeDismissedAt.getTime() > NUDGE_COOLDOWN_MS)

  return (
    <>
      {showNudge && <PasswordNudgeBanner />}
      <HomePage
        initialCredits={creditsData}
        initialSavedRoutes={savedRoutes}
      />
    </>
  )
}
