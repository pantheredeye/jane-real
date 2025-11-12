import { db } from '@/db'
import { requestInfo } from 'rwsdk/worker'
import { sessions } from '@/session/store'
import ManagePageClient from './ManagePageClient'

export default async function ManagePage() {
  const session = await sessions.load(requestInfo.request)
  const userId = session?.userId

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
