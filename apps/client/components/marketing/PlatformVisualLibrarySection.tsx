"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
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

export function PlatformVisualLibrarySection() {
  const [visuals, setVisuals] = useState<PlatformVisual[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadVisuals() {
      try {
        const data = await api.get<PlatformVisual[]>("/showcase/visuals", { skipAuth: true })
        const items = Array.isArray(data) ? data : []

        const validVisuals = items
          .filter((visual: PlatformVisual) => Boolean(visual.imageUrl))
          .sort((a: PlatformVisual, b: PlatformVisual) => {
            if (a.isFeatured && !b.isFeatured) return -1
            if (!a.isFeatured && b.isFeatured) return 1
            return (b.qualityScore || 0) - (a.qualityScore || 0)
          })
          .slice(0, 25)

        setVisuals(validVisuals)
      } catch (error) {
        console.error("Erreur chargement bibliothèque visuels:", error)
        setVisuals([])
      } finally {
        setLoading(false)
      }
    }

    void loadVisuals()
  }, [])

  const columns = useMemo(() => {
    const result: PlatformVisual[][] = [[], [], [], [], []]

    visuals.forEach((visual, index) => {
      result[index % 5].push(visual)
    })

    return result
  }, [visuals])

  return (
    <section className="relative overflow-hidden bg-[var(--bg-0)] px-6 py-28 text-[#fff7ef]">
      {/* Harmonized radial background glow matching standard sections */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(232,132,86,0.06),transparent_35%)]" />
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(to_right,rgba(255,247,239,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,247,239,0.05)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section entrance animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="mx-auto max-w-3xl text-center">
            {/* Pulsating title animation */}
            <h2 className="text-4xl font-semibold tracking-tight text-[#fff7ef] md:text-6xl animate-pulse-slow">
              Voyez ce que Studio Flyer AI peut faire
            </h2>

            <p className="mt-4 text-sm text-[#fff7ef]/45 md:text-base">
              Une bibliothèque de visuels marketing créés par la plateforme
            </p>
          </div>

          {/* Scroll Library Container */}
          <div className="relative mt-16 h-[520px] overflow-hidden rounded-[34px] border border-[#e9865a]/14 bg-[#090504]/80 shadow-[0_0_80px_rgba(233,134,90,0.12)] md:h-[620px]">
            {/* Edge fades blending seamlessly with section background var(--bg-0) */}
            <div className="absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-[var(--bg-0)] via-[var(--bg-0)]/70 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-[var(--bg-0)] via-[var(--bg-0)]/70 to-transparent" />

            {loading ? (
              <div className="flex h-full items-center justify-center">
                {/* Animated skeleton loading state */}
                <div className="grid grid-cols-2 gap-4 px-5 py-10 sm:grid-cols-3 lg:grid-cols-5">
                  {[...Array(15)].map((_, index) => (
                    <div key={index} className="flex flex-col gap-4">
                      {[{}, {}, {}].map((___, cardIndex) => {
                        const heights = [
                          "h-40 sm:h-48 md:h-52",
                          "h-52 sm:h-64 md:h-72",
                          "h-48 sm:h-60 md:h-64",
                          "h-56 sm:h-72 md:h-80",
                          "h-44 sm:h-52 md:h-60",
                        ]
                        const cardHeight = heights[(cardIndex + index) % heights.length]
                        return (
                          <div key={cardIndex} className={`${cardHeight} bg-[#17100c] rounded-2xl`}>
                            <div className="h-8 w-full rounded bg-[#1a100b]/30 animate-pulse" />
                            <div className="mt-2 h-4 w-full rounded bg-[#1a100b]/20 animate-pulse" />
                            <div className="mt-1 h-3 w-2/3 rounded bg-[#1a100b]/10 animate-pulse" />
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ) : visuals.length > 0 ? (
              <div className="grid h-full grid-cols-2 gap-4 px-5 py-10 sm:grid-cols-3 lg:grid-cols-5">
                {columns.map((column, columnIndex) => {
                  let columnClasses = "flex flex-col gap-4 "
                  if (columnIndex === 0 || columnIndex === 4) {
                    columnClasses += "hidden lg:flex opacity-55 animate-[visualScrollUp_28s_linear_infinite]"
                  } else if (columnIndex === 1) {
                    columnClasses += "hidden sm:flex opacity-75 animate-[visualScrollDown_30s_linear_infinite]"
                  } else if (columnIndex === 3) {
                    columnClasses += "flex opacity-75 animate-[visualScrollDown_30s_linear_infinite]"
                  } else {
                    // Index 2 (center column)
                    columnClasses += "flex opacity-100 animate-[visualScrollUp_28s_linear_infinite]"
                  }

                  return (
                    <div key={columnIndex} className={columnClasses}>
                      {[...column, ...column].map((visual, itemIndex) => {
                        const heights = [
                          "h-40 sm:h-48 md:h-52",
                          "h-52 sm:h-64 md:h-72",
                          "h-48 sm:h-60 md:h-64",
                          "h-56 sm:h-72 md:h-80",
                          "h-44 sm:h-52 md:h-60",
                        ]
                        const cardHeight = heights[(itemIndex + columnIndex) % heights.length]

                        return (
                          <motion.div
                            key={`${visual.id}-${itemIndex}`}
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative overflow-hidden rounded-2xl border border-[#e9865a]/12 bg-[#17100c] ${cardHeight} shadow-[0_0_35px_rgba(233,134,90,0.08)]`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <motion.img
                              src={visual.imageUrl}
                              alt={visual.title}
                              className="h-full w-full object-cover"
                              initial={{ opacity: 0.9 }}
                              animate={{ opacity: 1 }}
                              whileHover={{ opacity: 0.8 }}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-[#070403]/90 via-transparent to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <p className="line-clamp-2 text-xs font-semibold text-[#fff7ef]">
                                {visual.title}
                              </p>

                              {visual.category && (
                                <p className="mt-1 text-[11px] text-[#fff7ef]/45">
                                  {visual.category}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center">
                {/* Enhanced empty state with floating animations */}
                <div className="max-w-sm relative">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-[#e9865a]/15 bg-[#1a0f0a]/70 shadow-[0_0_40px_rgba(233,134,90,0.18)]">
                    <div className="h-8 w-8 rounded-xl bg-[#e9865a]/20 animate-float-slow" />
                  </div>

                  <p className="text-sm leading-relaxed text-[#fff7ef]/55">
                    Les meilleurs visuels créés avec Studio Flyer AI apparaîtront ici.
                  </p>

                  {/* Additional floating decorative elements */}
                  <div className="absolute -top-10 left-0 w-12 h-12 bg-[var(--acc)]/10 rounded-full animate-float" />
                  <div className="absolute bottom-5 right-0 w-8 h-8 bg-[var(--acc)]/15 rounded-full animate-float-reverse" />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes visualScrollUp {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }

        @keyframes visualScrollDown {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes float-reverse {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(10px);
          }
        }

        @keyframes float-slow {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-reverse {
          animation: float-reverse 6s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}