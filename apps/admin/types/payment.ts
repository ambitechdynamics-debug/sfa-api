import { AdminUser } from './user'

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface Payment {
  id: string
  userId: string
  user?: AdminUser
  amount: number
  currency: string
  provider: string
  status: PaymentStatus
  reference: string
  planName?: string
  createdAt: string
}

export interface ArtisticResource {
  id: string
  title: string
  category: string
  resourceType:
    | 'MODEL'
    | 'TEXTURE'
    | 'FONT'
    | 'PALETTE'
    | 'STYLE'
    | 'REFERENCE'
    | 'FORBIDDEN_RULE'
  url?: string
  description?: string
  tags?: string[]
  content?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}
