import { toast } from 'sonner'
import { AdminApiError, isAuthError } from './api-error'

export const toastSuccess = (msg: string) => toast.success(msg)
export const toastError = (msg: string) => toast.error(msg)

export function toastLoadError(error: unknown, fallbackMessage: string) {
  if (isAuthError(error)) return
  if (error instanceof AdminApiError && error.status === 0) {
    toast.error(error.message, { id: 'admin-api-unavailable' })
    return
  }
  toast.error(fallbackMessage, { id: `admin-load-error-${fallbackMessage}` })
}
