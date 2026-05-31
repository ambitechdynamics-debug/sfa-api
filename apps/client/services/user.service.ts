import { ApiError, apiFetch } from "@/lib/api"
import type { User } from "@/types/user"

// Retry transient 5xx (Neon DB cold-pause, gateway hiccup) avec backoff
// progressif. La vérification de session est sur le chemin critique du
// dashboard — sans retry, un cold-start Neon de 10s casse tout le login.
export async function getCurrentUser(): Promise<User> {
  const delays = [1_500, 3_000, 6_000]
  let lastErr: unknown
  for (let i = 0; i <= delays.length; i++) {
    try {
      return await apiFetch<User>("/api/users/me", { suppressAuthRedirect: true })
    } catch (err) {
      lastErr = err
      const transient =
        err instanceof ApiError && (err.status === 502 || err.status === 503 || err.status === 504)
      if (!transient || i === delays.length) throw err
      await new Promise((r) => setTimeout(r, delays[i]))
    }
  }
  throw lastErr
}
