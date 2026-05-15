import { apiFetch } from "@/lib/api"
import type { CreateUxMetricEventInput, UxMetricEvent, UxMetricSummary } from "@/types/ux-metrics"

const EVENT_TYPE_BY_NAME: Record<string, CreateUxMetricEventInput["eventType"]> = {
  dashboard_opened: "PAGE_VIEW",
  create_page_opened: "PAGE_VIEW",
  ai_workspace_opened: "PAGE_VIEW",
  billing_opened: "PAGE_VIEW",
  notifications_opened: "PAGE_VIEW",
  support_opened: "PAGE_VIEW",
  nav_clicked: "NAVIGATION",
  new_creation_clicked: "NAVIGATION",
  prompt_submitted: "NAVIGATION",
  generation_started: "NAVIGATION",
  generation_completed: "NAVIGATION",
  generation_failed: "NAVIGATION_ERROR",
  project_opened: "NAVIGATION",
  export_clicked: "NAVIGATION",
  satisfaction_submitted: "SATISFACTION",
}

export async function createUxMetricEvent(input: CreateUxMetricEventInput): Promise<UxMetricEvent> {
  return apiFetch<UxMetricEvent>("/api/ux-metrics/events", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function trackUxEvent(input: CreateUxMetricEventInput): Promise<void> {
  try {
    await createUxMetricEvent(input)
  } catch {
    // UX metrics must never block navigation or page rendering.
  }
}

export async function fetchUxMetricsSummary(): Promise<UxMetricSummary> {
  return apiFetch<UxMetricSummary>("/api/ux-metrics/summary")
}

export async function submitSatisfaction(score: number, payload: Record<string, unknown> = {}): Promise<void> {
  await apiFetch<UxMetricEvent>("/api/metrics/satisfaction", {
    method: "POST",
    body: JSON.stringify({
      score,
      path: typeof window === "undefined" ? "/dashboard/metrics" : window.location.pathname,
      payload,
    }),
  })
}

export function trackEvent(name: string, payload: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  void apiFetch<UxMetricEvent>("/api/metrics/event", {
    method: "POST",
    body: JSON.stringify({
      name,
      path: window.location.pathname,
      payload: { mappedEventType: EVENT_TYPE_BY_NAME[name] ?? "NAVIGATION", ...payload },
    }),
  }).catch(() => {
    // Metrics must never block the product flow.
  })
}
