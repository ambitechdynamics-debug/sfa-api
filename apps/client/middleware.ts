import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/ai-settings(.*)",
  "/billing(.*)",
  "/create(.*)",
  "/metrics(.*)",
  "/notifications(.*)",
  "/profile(.*)",
  "/projects(.*)",
  "/settings(.*)",
  "/support(.*)",
])

export default clerkMiddleware(async (auth, req) => {
  if (!isProtectedRoute(req)) return NextResponse.next()

  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    // Preserve the original `next` query so the login page can redirect back
    // after a successful sign-in (Clerk uses `redirect_url` natively, but the
    // existing login UI reads `next`).
    return redirectToSignIn({ returnBackUrl: req.url })
  }

  const response = NextResponse.next()
  response.headers.set("cache-control", "no-store, no-cache, max-age=0, must-revalidate, private")
  response.headers.set("cdn-cache-control", "no-store")
  response.headers.set("vercel-cdn-cache-control", "no-store")
  response.headers.set("vary", "cookie")
  return response
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
