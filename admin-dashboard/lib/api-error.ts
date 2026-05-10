export class AdminApiError extends Error {
  status: number

  constructor(message: string, status = 0) {
    super(message)
    this.name = 'AdminApiError'
    this.status = status
  }
}

export function isAuthError(error: unknown): boolean {
  return error instanceof AdminApiError && (error.status === 401 || error.status === 403)
}

