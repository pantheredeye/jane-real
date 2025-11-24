import { route } from 'rwsdk/router'
import { requireAuth } from '@/app/interruptors'
import { AccountPage } from './AccountPage'

export const accountRoutes = [
  route('/', [requireAuth, AccountPage])
]
