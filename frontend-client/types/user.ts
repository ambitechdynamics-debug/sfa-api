export type Role = "USER" | "ADMIN"

export interface User {
  id: string
  fullName: string
  email: string
  phone?: string | null
  role: Role
  credits: number
  createdAt: string
  updatedAt: string
}
