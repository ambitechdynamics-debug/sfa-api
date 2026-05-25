import { NextRequest, NextResponse } from "next/server"

const API_URL = (
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV !== "production" ? "http://localhost:5000" : "")
).replace(/\/+$/, "")
const NEON_AUTH_URL = (
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  "https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth"
).replace(/\/+$/, "")

type ChatProxyResponse = {
  success?: boolean
  reply?: string
  conversationId?: string
  travailId?: string
  projectId?: string
  title?: string
  error?: string
  message?: string | {
    role?: string
    content?: string
  }
  fallback?: boolean
  data?: {
    reply?: string
    conversationId?: string
    travailId?: string
    projectId?: string
    title?: string
    message?: {
      role?: string
      content?: string
    }
  }
}

type ChatProxyRequest = {
  message?: unknown
  conversationId?: unknown
  travailId?: unknown
  projectId?: unknown
  history?: unknown
  visualConfig?: unknown
}
function findAuthToken(value: unknown, seen = new Set<unknown>(), acceptString = true): string {
  if (typeof value === "string") return acceptString && value.trim() ? value.trim() : ""
  if (!value || typeof value !== "object" || seen.has(value)) return ""
  seen.add(value)

  if (Array.isArray(value)) {
    for (const item of value) {
      const token = findAuthToken(item, seen, acceptString)
      if (token) return token
    }
    return ""
  }

  const record = value as Record<string, unknown>
  for (const key of ["token", "jwt", "idToken", "id_token", "accessToken", "access_token"]) {
    const token = findAuthToken(record[key], seen, true)
    if (token) return token
  }

  for (const item of Object.values(record)) {
    const token = findAuthToken(item, seen, false)
    if (token) return token
  }

  return ""
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function isLocalConversationId(value?: string) {
  return Boolean(value?.startsWith("local-"))
}

function normalizeHistory(value: unknown) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null
      const record = item as Record<string, unknown>
      const role = record.role === "user" || record.role === "assistant" ? record.role : null
      const content = typeof record.content === "string" ? record.content.trim() : ""
      return role && content ? { role, content } : null
    })
    .filter((item): item is { role: "user" | "assistant"; content: string } => Boolean(item))
}

function makeLocalConversationId() {
  return `local-${globalThis.crypto.randomUUID()}`
}



function successResponse(input: {
  reply: string
  conversationId?: string
  projectId?: string
  title?: string
  fallback?: boolean
}) {
  return NextResponse.json({
    success: true,
    reply: input.reply,
    conversationId: input.conversationId,
    projectId: input.projectId,
    title: input.title,
    fallback: input.fallback,
    message: {
      role: "assistant",
      content: input.reply,
    },
  })
}

function extractAssistantContent(value: ChatProxyResponse["message"]) {
  return typeof value === "object" && value ? value.content : undefined
}

function unavailableResponse(body: Awaited<ReturnType<typeof readChatBody>>, status: number, error: string, title?: string) {
  return NextResponse.json({ success: false, error }, { status })
}

async function readChatBody(request: NextRequest) {
  let payload: ChatProxyRequest
  try {
    payload = (await request.json()) as ChatProxyRequest
  } catch {
    throw new Error("INVALID_JSON")
  }

  const travailId = normalizeOptionalString(payload.travailId) || normalizeOptionalString(payload.conversationId)

  return {
    message: typeof payload.message === "string" ? payload.message : "",
    travailId,
    projectId: normalizeOptionalString(payload.projectId),
    history: normalizeHistory(payload.history),
    visualConfig: payload.visualConfig && typeof payload.visualConfig === "object" ? payload.visualConfig : undefined,
  }
}

async function getCookieAuthHeader(request: NextRequest) {
  const cookie = request.headers.get("cookie")
  if (!cookie) return undefined

  const authEndpoints = [
    { url: `${request.nextUrl.origin}/api/auth/token`, method: "GET" },
    { url: `${request.nextUrl.origin}/api/auth/get-session`, method: "GET" },
    { url: `${NEON_AUTH_URL}/token`, method: "GET" },
    { url: `${NEON_AUTH_URL}/get-session`, method: "GET" },
  ] satisfies Array<{ url: string; method: "GET" }>

  for (const endpoint of authEndpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: {
          Accept: "application/json",
          Cookie: cookie,
        },
        cache: "no-store",
      })

      const headerToken = response.headers.get("set-auth-jwt") || response.headers.get("set-auth-token")
      if (headerToken?.trim()) return `Bearer ${headerToken.trim()}`

      const data = (await response.json().catch(() => null)) as unknown
      const bodyToken = findAuthToken(data)
      if (bodyToken) return `Bearer ${bodyToken}`
    } catch {
      // Try the next auth endpoint.
    }
  }

  return undefined
}

async function getAuthHeader(request: NextRequest) {
  const cookieAuthorization = await getCookieAuthHeader(request)
  if (cookieAuthorization) return cookieAuthorization

  const authorization = request.headers.get("authorization")
  return authorization ?? undefined
}

export async function POST(request: NextRequest) {
  try {
    const body = await readChatBody(request)
    if (!body.message.trim()) {
      return NextResponse.json(
        { success: false, error: "Le message ne peut pas être vide." },
        { status: 400 },
      )
    }

    const authorization = await getAuthHeader(request)
    if (!authorization) {
      return unavailableResponse(
        body,
        401,
        "Session IA invalide. Reconnectez-vous puis réessayez.",
      )
    }

    if (!API_URL) {
      return unavailableResponse(
        body,
        503,
        "L'URL de l'API IA n'est pas configurée.",
      )
    }

    const upstreamBody = {
      ...body,
      travailId: isLocalConversationId(body.travailId) ? undefined : body.travailId,
    }

    let upstream: Response
    try {
      upstream = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify(upstreamBody),
      })
    } catch {
      return unavailableResponse(
        body,
        503,
        "Impossible de joindre l'agent IA. Vérifiez la connexion au backend.",
      )
    }

    const data = (await upstream.json().catch(() => ({}))) as ChatProxyResponse
    if (!upstream.ok || data.success !== true) {
      return unavailableResponse(
        body,
        upstream.status || 502,
        data.error || (typeof data.message === "string" ? data.message : "") || "L'agent IA n'a pas pu traiter la demande.",
        data.title ?? data.data?.title,
      )
    }

    const reply = extractAssistantContent(data.message) ?? data.reply ?? data.data?.message?.content ?? data.data?.reply
    const travailId = data.travailId ?? data.data?.travailId ?? data.conversationId ?? data.data?.conversationId
    if (!reply) {
      return unavailableResponse(
        body,
        502,
        "La réponse de l'agent IA est vide.",
        data.title ?? data.data?.title,
      )
    }

    return successResponse({
      reply,
      conversationId: travailId, // keep returning conversationId for old clients just in case, but successResponse doesn't strictly depend on name
      projectId: data.projectId ?? data.data?.projectId,
      title: data.title ?? data.data?.title,
    })
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_JSON") {
      return NextResponse.json(
        { success: false, error: "Le corps de la requête doit être un JSON valide." },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { success: false, error: "Une erreur est survenue. Veuillez réessayer." },
      { status: 502 },
    )
  }
}
