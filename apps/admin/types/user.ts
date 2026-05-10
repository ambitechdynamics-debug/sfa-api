export interface AdminUser {
  id: string
  fullName: string
  email: string
  phone?: string
  role: 'USER' | 'ADMIN'
  credits: number
  createdAt: string
  updatedAt?: string
  // from Prisma _count include
  _count?: { projects: number }
  // computed/optional fields for display
  projectCount?: number
}

export interface CreditTransaction {
  id: string
  userId: string
  user?: AdminUser
  type: 'ADD' | 'REMOVE' | 'CONSUME_GENERATION' | 'CONSUME_PROMPT' | 'REFUND' | 'BONUS'
  amount: number
  balanceAfter: number
  reason?: string
  createdAt: string
}
