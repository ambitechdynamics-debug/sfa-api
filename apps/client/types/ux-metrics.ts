export type UxMetricEventType = "PAGE_VIEW" | "NAVIGATION" | "SATISFACTION" | "NAVIGATION_ERROR"

export interface CreateUxMetricEventInput {
  eventType: UxMetricEventType
  path: string
  fromPath?: string | null
  toPath?: string | null
  durationMs?: number | null
  satisfactionScore?: number | null
  metadata?: Record<string, unknown>
}

export interface UxMetricEvent {
  id: string
  eventType: UxMetricEventType
  path: string
  fromPath?: string | null
  toPath?: string | null
  durationMs?: number | null
  satisfactionScore?: number | null
  createdAt: string
}

export interface UxMetricRouteBreakdown {
  path: string
  count: number
}

export interface UxMetricSummary {
  windowDays: number
  totalEvents: number
  navigationCount: number
  averageNavigationMs: number | null
  satisfactionCount: number
  satisfactionAverage: number | null
  satisfactionRate: number | null
  navigationErrorCount: number
  exportCount: number
  routeBreakdown: UxMetricRouteBreakdown[]
  recentEvents: UxMetricEvent[]
  generatedAt: string
}
