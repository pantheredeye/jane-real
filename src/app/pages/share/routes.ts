import { route } from 'rwsdk/router'
import { requireAuth } from '@/app/interruptors'
import { SharePage } from './SharePage'

export const shareRoutes = [
  route('/', [requireAuth, SharePage])
]
