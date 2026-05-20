"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"

type PlatformVisual = {
  id: string
  title: string
  imageUrl: string
  category?: string
  createdAt?: string
  isFeatured?: boolean
  qualityScore?: number
}

export function AdCreationShowcase() {
  const [visuals, setVisuals] = useState<PlatformVisual[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlatformVisuals() {
      try {
        // Query the Express API showcase endpoint, bypassing JWT auth check
        const data = await api.get<PlatformVisual[]>("/showcase/visuals", { skipAuth: true })
        const validVisuals = Array.isArray(data)
          ? data.filter((visual) => visual.imageUrl)
          : []
        setVisuals(validVisuals)
      } catch (error) {
        console.error("Erreur chargement showcase visuals:", error)
        setVisuals([])
      } finally {
        setLoading(false)
      }
    }

    void loadPlatformVisuals()
  }, [])

  useEffect(() => {
    if (visuals.length <= 1) return

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % visuals.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [visuals.length])

  const activeVisual = visuals[activeIndex]

  return (
    <section className="relative overflow-hidden bg-[var(--bg-0)] px-6 py-28 text-[#fff7ef]">
      {/* Background gradients and grid aligned exactly with other sections */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,132,86,0.06),transparent_40%)]" />
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-20 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-[#fff7ef] md:text-5xl">
            Création de publicité en une phrase
          </h2>

          <div className="mt-10 space-y-8">
            <div className="relative pl-5">
              <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-[#e9865a] shadow-[0_0_14px_rgba(233,134,90,0.55)]" />
              <h3 className="text-sm font-semibold text-[#fff7ef]">
                Planification intelligente des campagnes
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#fff7ef]/60">
                Studio Flyer AI comprend votre objectif, analyse votre besoin et transforme une simple idée en direction visuelle claire.
              </p>
            </div>

            <div className="relative pl-5">
              <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-[#f3a071] shadow-[0_0_14px_rgba(243,160,113,0.55)]" />
              <h3 className="text-sm font-semibold text-[#fff7ef]">
                Visuels publicitaires à fort impact
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#fff7ef]/60">
                La plateforme génère des affiches, flyers, bannières et visuels sociaux prêts pour la communication digitale.
              </p>
            </div>

            <div className="relative pl-5">
              <span className="absolute left-0 top-2 h-2 w-2 rounded-full bg-[#c96c43] shadow-[0_0_14px_rgba(201,108,67,0.55)]" />
              <h3 className="text-sm font-semibold text-[#fff7ef]">
                Amélioration HD en un clic
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#fff7ef]/60">
                Importez une affiche existante et laissez l’IA améliorer la composition, les couleurs, le texte et la qualité générale.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          {/* Main frame: border animation removed, styled exactly as other UI cards */}
          <div className="relative min-h-[430px] overflow-hidden rounded-[28px] border border-[#e9865a]/15 bg-[var(--bg-1)] shadow-[0_0_50px_rgba(233,134,90,0.08)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(233,134,90,0.1),transparent_45%),radial-gradient(circle_at_top_left,rgba(159,79,49,0.08),transparent_38%)]" />

            <div className="relative h-full min-h-[430px] overflow-hidden rounded-[27px]">
              {/* Badge */}
              <div className="absolute left-6 top-6 z-20 rounded-full border border-[#e9865a]/20 bg-[#1a0f0a]/80 px-4 py-2 text-xs text-[#fff7ef]/70 backdrop-blur-md shadow-[0_0_20px_rgba(233,134,90,0.12)]">
                Meilleurs visuels Studio Flyer AI
              </div>

              {/* Center showcase visuals / loading / empty state */}
              {loading ? (
                <div className="relative z-10 flex h-full min-h-[430px] items-center justify-center">
                  <div className="text-sm text-[#fff7ef]/50">
                    Chargement des visuels de la plateforme...
                  </div>
                </div>
              ) : activeVisual ? (
                <div className="absolute inset-0 flex items-center justify-center p-10">
                  <div className="relative z-10 h-[320px] w-[230px] animate-[float_4s_ease-in-out_infinite] overflow-hidden rounded-2xl border border-[#e9865a]/20 bg-black shadow-2xl transition-all duration-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeVisual.imageUrl}
                      alt={activeVisual.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {visuals.length > 1 && (
                    <>
                      {visuals[activeIndex - 1 >= 0 ? activeIndex - 1 : visuals.length - 1] && (
                        <div className="absolute left-12 top-24 h-[210px] w-[150px] -rotate-12 overflow-hidden rounded-2xl border border-[#e9865a]/15 bg-[#1a0f0a]/50 opacity-40 shadow-xl transition-all duration-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={visuals[activeIndex - 1 >= 0 ? activeIndex - 1 : visuals.length - 1].imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}

                      {visuals[(activeIndex + 1) % visuals.length] && (
                        <div className="absolute bottom-20 right-12 h-[230px] w-[160px] rotate-12 overflow-hidden rounded-2xl border border-[#e9865a]/15 bg-[#1a0f0a]/50 opacity-40 shadow-xl transition-all duration-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={visuals[(activeIndex + 1) % visuals.length].imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Ghost decorative cards in background for professional warm empty state */}
                  <div className="absolute left-10 top-24 h-40 w-28 -rotate-12 rounded-2xl border border-[#e9865a]/10 bg-[#e9865a]/[0.03]" />
                  <div className="absolute right-12 bottom-24 h-44 w-32 rotate-12 rounded-2xl border border-[#e9865a]/10 bg-[#e9865a]/[0.03]" />
                  <div className="absolute left-1/2 top-1/2 h-52 w-36 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#e9865a]/10 bg-[#e9865a]/[0.025]" />

                  {/* Empty state message container */}
                  <div className="relative z-10 flex h-full min-h-[430px] items-center justify-center">
                    <div className="relative max-w-xs text-center">
                      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#e9865a]/15 bg-[#1a0f0a]/70 shadow-[0_0_40px_rgba(233,134,90,0.18)]">
                        <div className="h-8 w-8 rounded-xl bg-[#e9865a]/20" />
                      </div>

                      <p className="text-sm leading-relaxed text-[#fff7ef]/55">
                        Les meilleurs visuels créés avec Studio Flyer AI apparaîtront ici.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Lower bar */}
              <div className="absolute bottom-6 left-6 right-6 z-20 flex items-center justify-between rounded-2xl border border-[#e9865a]/15 bg-[#0d0705]/75 px-5 py-4 backdrop-blur-md shadow-[0_0_30px_rgba(233,134,90,0.08)]">
                <div>
                  <p className="text-sm font-medium text-[#fff7ef]">
                    {activeVisual?.title || "Showcase Studio Flyer AI"}
                  </p>
                  <p className="mt-1 text-xs text-[#fff7ef]/45">
                    Visuel créé par la plateforme
                  </p>
                </div>

                {visuals.length > 1 && (
                  <div className="flex gap-2">
                    {visuals.map((visual, index) => (
                      <button
                        key={visual.id}
                        type="button"
                        onClick={() => setActiveIndex(index)}
                        className={`h-2 w-2 rounded-full transition-all ${
                          index === activeIndex ? "w-6 bg-[#e9865a]" : "bg-[#fff7ef]/20"
                        }`}
                        aria-label={`Afficher ${visual.title}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes float {
              0%, 100% {
                transform: translateY(0px) scale(1);
              }
              50% {
                transform: translateY(-12px) scale(1.02);
              }
            }
          `}</style>
        </div>
      </div>
    </section>
  )
}
