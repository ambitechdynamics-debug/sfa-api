/**
 * No-op shim that replaces `sonner` at build time.
 *
 * Configured via next.config.ts (turbopack.resolveAlias).
 *
 * Goal: removing the visual toast layer everywhere without touching the 11
 * files that call `toast.success(...)`, `toast.error(...)`, etc. The calls
 * still execute but produce nothing visible — they are forwarded to
 * `console.info` / `console.error` so messages are still debuggable from the
 * browser console if needed.
 */

type ToastInput = string | { message?: string } | null | undefined

function format(v: ToastInput): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  if (typeof v === "object" && typeof (v as { message?: unknown }).message === "string") {
    return (v as { message: string }).message
  }
  try { return JSON.stringify(v) } catch { return String(v) }
}

const noop = () => {}

export const toast = Object.assign(
  (msg: ToastInput) => console.info("[toast]", format(msg)),
  {
    success: (msg: ToastInput) => console.info("[toast/success]", format(msg)),
    error:   (msg: ToastInput) => console.error("[toast/error]", format(msg)),
    warning: (msg: ToastInput) => console.warn("[toast/warning]", format(msg)),
    info:    (msg: ToastInput) => console.info("[toast/info]", format(msg)),
    message: (msg: ToastInput) => console.info("[toast]", format(msg)),
    promise: <T>(p: Promise<T>) => p,
    loading: (msg: ToastInput) => console.info("[toast/loading]", format(msg)),
    dismiss: noop,
    custom:  noop,
  }
)

// Permet aux imports `import { Toaster } from "sonner"` de continuer à
// compiler — renvoie null pour ne rien rendre.
export const Toaster = () => null
