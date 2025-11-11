import { sessions } from './store'

/**
 * Get the current user ID from the session
 * Returns null if no session or no user logged in
 */
export async function getSessionUserId(request: Request): Promise<string | null> {
  try {
    const session = await sessions.load(request)
    return session?.userId || null
  } catch (error) {
    console.error('Failed to load session:', error)
    return null
  }
}

/**
 * Get the full session object
 */
export async function getSession(request: Request) {
  try {
    return await sessions.load(request)
  } catch (error) {
    console.error('Failed to load session:', error)
    return null
  }
}
