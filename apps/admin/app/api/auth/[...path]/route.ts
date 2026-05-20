import { NextRequest, NextResponse } from 'next/server'

const NEON_AUTH_URL =
  process.env.NEXT_PUBLIC_NEON_AUTH_URL ||
  'https://ep-blue-night-akk7bv95.neonauth.c-3.us-west-2.aws.neon.tech/neondb/auth'

const REQUEST_HEADERS = [
  'accept',
  'accept-language',
  'content-type',
  'cookie',
  'user-agent',
]

const RESPONSE_HEADERS_TO_DROP = new Set([
  'connection',
  'content-encoding',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'set-cookie',
  'transfer-encoding',
  'upgrade',
])

type RouteContext = {
  params: Promise<{ path?: string[] }> | { path?: string[] }
}

function splitSetCookieHeader(value: string): string[] {
  return value.split(/,(?=\s*[^;,]+=)/g).map((cookie) => cookie.trim()).filter(Boolean)
}

function rewriteSetCookie(cookie: string): string {
  const [nameValue, ...attributes] = cookie.split(';').map((part) => part.trim())
  const filtered = attributes.filter((attribute) => {
    return !/^domain=/i.test(attribute) && !/^path=/i.test(attribute)
  })
  return [nameValue, 'Path=/', ...filtered].join('; ')
}

function buildTargetUrl(path: string[], search: string): URL {
  const base = NEON_AUTH_URL.replace(/\/$/, '')
  const target = new URL(`${base}/${path.map(encodeURIComponent).join('/')}`)
  target.search = search
  return target
}

function buildRequestHeaders(request: NextRequest): Headers {
  const headers = new Headers()
  for (const name of REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }
  const authOrigin = new URL(NEON_AUTH_URL).origin
  headers.set('origin', authOrigin)
  headers.set('referer', `${NEON_AUTH_URL.replace(/\/+$/, '')}/`)
  return headers
}

function buildResponseHeaders(upstream: Response): Headers {
  const headers = new Headers()
  upstream.headers.forEach((value, name) => {
    if (!RESPONSE_HEADERS_TO_DROP.has(name.toLowerCase())) {
      headers.set(name, value)
    }
  })
  return headers
}

function rewriteLocation(location: string | null, request: NextRequest): string | null {
  if (!location) return null
  try {
    const locationUrl = new URL(location)
    const neonUrl = new URL(NEON_AUTH_URL)
    if (locationUrl.origin !== neonUrl.origin) return location

    const neonPath = neonUrl.pathname.replace(/\/$/, '')
    if (!locationUrl.pathname.startsWith(neonPath)) return location

    const authPath = locationUrl.pathname.slice(neonPath.length).replace(/^\//, '')
    return `${request.nextUrl.origin}/api/auth/${authPath}${locationUrl.search}${locationUrl.hash}`
  } catch {
    return location
  }
}

async function proxyAuth(request: NextRequest, context: RouteContext): Promise<Response> {
  const params = await context.params
  const target = buildTargetUrl(params.path ?? [], request.nextUrl.search)
  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer()

  const upstream = await fetch(target, {
    method: request.method,
    headers: buildRequestHeaders(request),
    body,
    redirect: 'manual',
  })

  const headers = buildResponseHeaders(upstream)
  const rewrittenLocation = rewriteLocation(upstream.headers.get('location'), request)
  if (rewrittenLocation) headers.set('location', rewrittenLocation)

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })

  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie
  const cookies = getSetCookie
    ? getSetCookie.call(upstream.headers)
    : splitSetCookieHeader(upstream.headers.get('set-cookie') ?? '')

  for (const cookie of cookies) {
    response.headers.append('set-cookie', rewriteSetCookie(cookie))
  }

  return response
}

export const GET = proxyAuth
export const POST = proxyAuth
export const PUT = proxyAuth
export const PATCH = proxyAuth
export const DELETE = proxyAuth
export const OPTIONS = proxyAuth
