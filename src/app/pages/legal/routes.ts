import { route } from 'rwsdk/router'
import Terms from './Terms'
import Privacy from './Privacy'

export const legalRoutes = [
  route('/privacy', Privacy),
  route('/terms', Terms)
]
