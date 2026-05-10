import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "il y a 2 h", "hier", "il y a 3 j" — French relative time (lightweight) */
export function relativeTime(iso: string): string {
  const now = Date.now()
  const t = new Date(iso).getTime()
  const diff = Math.max(0, now - t)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.floor(h / 24)
  if (d === 1) return "hier"
  if (d < 7) return `il y a ${d} j`
  const w = Math.floor(d / 7)
  if (w < 5) return `il y a ${w} sem`
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("")
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(amount)
}
