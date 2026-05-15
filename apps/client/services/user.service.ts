import { apiFetch } from "@/lib/api"
import type { User } from "@/types/user"

export function getCurrentUser() {
  return apiFetch<User>("/api/users/me", { suppressAuthRedirect: true })
}
