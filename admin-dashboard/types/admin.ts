export interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalProjects: number
  promptsGenerated: number
  postersGenerated: number
  creditsConsumed: number
  monthlyRevenue: number
  successfulPayments: number
  aiFailureRate: number
  activeAgents: number
}

export interface ChartDataPoint {
  date: string
  value: number
}

export interface MultiChartDataPoint {
  date: string
  users?: number
  generations?: number
  revenue?: number
  prompts?: number
}

export type PosterTypeDistribution = {
  name: string
  value: number
  color: string
}

export interface RecentError {
  id: string
  agentName: string
  projectId: string
  error: string
  createdAt: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  credits: number
  currency: string
  features: string[]
  maxProjects: number
  maxFilesPerProject: number
  isActive: boolean
  subscribersCount: number
}
