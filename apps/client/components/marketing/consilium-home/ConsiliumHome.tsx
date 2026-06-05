"use client"

import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Header from "./Header"
import LandingPage from "./LandingPage"
import Footer from "./Footer"
import { useAuth } from "@/hooks/useAuth"

export function ConsiliumHome() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  // Source of truth for "has an open session" is Clerk itself. The
  // backend-validated `isAuthenticated` may still be false during the brief
  // window between Clerk session load and the /users/me call — in that
  // case we still want Connect to land on /dashboard, where the (app)
  // layout shows a loading state until the backend profile is ready.
  const { isLoaded: clerkLoaded, isSignedIn } = useUser()
  const hasSession = isAuthenticated || (clerkLoaded && isSignedIn === true)

  function scrollToSection(id: string) {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  function handleNavigate(route: string) {
    if (route === "app") {
      window.location.assign(hasSession ? "/dashboard" : "/login?next=%2Fdashboard")
      return
    }

    if (route === "landing") {
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    if (route === "prices") {
      scrollToSection("pricing-section")
      return
    }

    if (route.endsWith("-section")) {
      scrollToSection(route)
    }
  }

  return (
    <div className="consilium-home min-h-screen bg-[#0B0B0F] text-zinc-300">
      <Header onNavigate={handleNavigate} />
      <main className="pt-20">
        <LandingPage onNavigate={handleNavigate} isLightMode={false} />
      </main>
      <Footer onNavigate={handleNavigate} isLightMode={false} />
    </div>
  )
}
