import { getSessionUserId } from '@/session/sessionManager'
import { db } from '@/db'
import ManagePageClient from './ManagePageClient'

export default async function ManagePage({ request }: { request: Request }) {
  const userId = await getSessionUserId(request)

  if (!userId) {
    return (
      <div className="subscribe-page">
        <div className="subscribe-container">
          <h1>Not Authenticated</h1>
          <p>Please log in to manage your subscription.</p>
        </div>
      </div>
    )
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialEndsAt: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      grandfathered: true,
    },
  })

  if (!user) {
    return (
      <div className="subscribe-page">
        <div className="subscribe-container">
          <h1>User Not Found</h1>
        </div>
      </div>
    )
  }

  return <ManagePageClient user={user} />
}
