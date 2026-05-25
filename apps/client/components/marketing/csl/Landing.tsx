"use client"

import { useEffect, useState } from "react"
import { LANDING_CONTENT, type Lang } from "@/lib/landing-content"
import { TopNav, Hero, LogosBand, Pillars } from "./sections-top"
import { Templates, UseCases, HowItWorks, Pricing, Reviews, Contact, Footer } from "./sections-bot"

/**
 * Detects the user's preferred language at mount.
 * Defaults to "fr" (matches the rest of the app).
 */
function detectLang(): Lang {
  if (typeof navigator === "undefined") return "fr"
  const n = navigator.language?.toLowerCase() ?? "fr"
  return n.startsWith("fr") ? "fr" : "en"
}

export function CslLanding() {
  // Start with "fr" SSR-side; sync to navigator after mount to avoid hydration mismatch.
  const [lang, setLang] = useState<Lang>("fr")

  useEffect(() => {
    setLang(detectLang())
  }, [])

  const t = LANDING_CONTENT[lang]

  return (
    <div className="landing-page">
      <TopNav t={t} lang={lang} setLang={setLang} />
      <Hero t={t} lang={lang} />
      <LogosBand t={t} />
      <Pillars t={t} />
      <Templates t={t} lang={lang} />
      <UseCases t={t} lang={lang} />
      <HowItWorks t={t} />
      <Pricing t={t} lang={lang} />
      <Reviews t={t} />
      <Contact t={t} lang={lang} />
      <Footer t={t} lang={lang} setLang={setLang} />
    </div>
  )
}
