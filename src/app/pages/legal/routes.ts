import { route } from 'rwsdk/router'
import { PrivacyPage } from './PrivacyPage'
import { TermsPage } from './TermsPage'

export const legalRoutes = [
  route('/privacy', PrivacyPage),
  route('/terms', TermsPage)
]
