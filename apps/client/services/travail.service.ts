import { api } from "@/lib/api"
import type { Travail } from "@/types/project"

type ApiMessageRole = "user" | "assistant" | "system" | "USER" | "ASSISTANT" | "SYSTEM"

export interface ApiMessage {
  id: string
  role: ApiMessageRole
  content: string
  createdAt: string
}

export type ApiTravail = Travail & {
  messages?: ApiMessage[]
}

export function fetchTravaux(projectId?: string) {
  const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""
  return api.get<ApiTravail[]>(`/travaux${qs}`)
}

export function fetchTravail(id: string) {
  return api.get<ApiTravail>(`/travaux/${id}`)
}

export function updateTravail(
  id: string,
  body: Partial<{
    title: string
    posterType: string | null
    category: string | null
    format: string | null
    style: string | null
    status: Travail["status"]
  }>,
) {
  return api.patch<ApiTravail>(`/travaux/${id}`, body)
}

export function deleteTravail(id: string) {
  return api.delete<void>(`/travaux/${id}`)
}

export function createTravail(
  projectId: string,
  body: {
    title: string
    posterType?: string
    category?: string
    format?: string
    style?: string
  },
) {
  return api.post<ApiTravail>(`/projects/${projectId}/travaux`, body)
}
