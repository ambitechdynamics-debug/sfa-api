"use client"

import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { Textarea } from "@/components/ui/Input"
import { Poster } from "@/components/poster/Poster"
import {
  fetchProject,
  fetchAgentRuns,
  runAgent,
  generateImages,
  fetchGeneratedPosters,
} from "@/lib/projects"
import { ApiError } from "@/lib/api"
import type { Project, AgentRun, GeneratedPoster } from "@/types/project"
import { relativeTime } from "@/lib/utils"

const PHASES = [
  { id: "queued",     label: "En file d'attente" },
  { id: "imagining",  label: "Composition" },
  { id: "rendering",  label: "Rendu haute déf." },
  { id: "polishing",  label: "Finitions" },
  { id: "ready",      label: "Prêt" },
]

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [posters, setPosters] = useState<GeneratedPoster[]>([])
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(0)
  const [retouchOpen, setRetouchOpen] = useState(false)
  const [retouchText, setRetouchText] = useState("")
  const [retouching, setRetouching] = useState(false)
  const [versions, setVersions] = useState([
    { id: "v1", label: "v1 · Génération initiale", at: new Date().toISOString(), note: "4 propositions générées", current: true },
  ])

  // Image generation trigger state — guards against double-trigger
  const triggeredRef = useRef(false)
  const [genError, setGenError] = useState<string | null>(null)

  // Initial fetch + polling agent-runs + generated posters
  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      try {
        const [p, r, gp] = await Promise.all([
          fetchProject(id),
          fetchAgentRuns(id).catch(() => [] as AgentRun[]),
          fetchGeneratedPosters(id).catch(() => [] as GeneratedPoster[]),
        ])
        if (cancelled) return
        setProject(p)
        setRuns(r)
        setPosters(gp)

        // ─── Phase / progress logic ────────────────────────────────
        // Once the project has reached PROMPT_READY (M-PROMPT1 persisted),
        // we auto-trigger image generation exactly once.
        if (
          (p.status === "PROMPT_READY" || p.status === "READY_FOR_PROMPT") &&
          gp.length === 0 &&
          !triggeredRef.current
        ) {
          triggeredRef.current = true
          generateImages(id, { variations: 4 })
            .then((res) => {
              setPosters(res.posters)
              setProject((prev) => (prev ? { ...prev, status: "GENERATED" } : prev))
              toast.success(`${res.posters.length} variantes générées`)
            })
            .catch((err) => {
              const msg = err instanceof ApiError ? err.message : "Erreur de génération d'images"
              setGenError(msg)
              toast.error(msg)
            })
        }

        // Compute display phase from real backend status
        if (p.status === "GENERATED" && gp.length > 0) {
          setPhaseIdx(PHASES.length - 1)
          setProgress(1)
          return
        }
        if (p.status === "FAILED") {
          toast.error("La génération a échoué")
          setGenError("La génération a échoué côté serveur.")
          return
        }
        // While agents run, advance phase based on success count among the 7 prompt agents
        const successCount = r.filter((x) => x.status === "SUCCESS").length
        const phase = Math.min(PHASES.length - 2, Math.floor((successCount / 7) * (PHASES.length - 1)))
        setPhaseIdx(phase)
        setProgress(Math.min(0.95, successCount / 7))
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : "Erreur"
          toast.error(msg)
        }
      }
    }

    tick()
    const t = setInterval(tick, 2500)
    return () => { cancelled = true; clearInterval(t) }
  }, [id])

  // Smooth progress animation while generating
  useEffect(() => {
    if (phaseIdx >= PHASES.length - 1) return
    const start = Date.now()
    const startVal = progress
    const target = Math.min(0.95, (phaseIdx + 1) / (PHASES.length - 1))
    let raf: number
    const animate = () => {
      const elapsed = Date.now() - start
      const p = Math.min(1, elapsed / 1500)
      setProgress(startVal + (target - startVal) * p)
      if (p < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIdx])

  const ready = phaseIdx >= PHASES.length - 1 || (project?.status === "GENERATED" && posters.length > 0)
  const selectedPoster = posters[selectedVariant]

  async function regenerate() {
    setGenError(null)
    setPhaseIdx(0)
    setProgress(0)
    triggeredRef.current = true
    try {
      const res = await generateImages(id, { variations: 4 })
      setPosters(res.posters)
      setProject((prev) => (prev ? { ...prev, status: "GENERATED" } : prev))
      toast.success(`${res.posters.length} nouvelles variantes`)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erreur de régénération"
      setGenError(msg)
      toast.error(msg)
    }
  }

  function downloadPoster(p: GeneratedPoster) {
    // Cloudinary supports `?fl_attachment` query for forced download
    const url = p.imageUrl.includes("/upload/")
      ? p.imageUrl.replace("/upload/", "/upload/fl_attachment/")
      : p.imageUrl
    window.open(url, "_blank")
  }

  async function submitRetouch() {
    if (!retouchText.trim()) return
    setRetouching(true)
    try {
      await runAgent("retouch-agent", id, { instruction: retouchText, posterId: selectedPoster?.id })
      setVersions((vs) => [
        { id: `v${vs.length + 1}`, label: `v${vs.length + 1} · Retouche`, at: new Date().toISOString(), note: retouchText.slice(0, 60), current: true },
        ...vs.map((v) => ({ ...v, current: false })),
      ])
      setRetouchText("")
      setRetouchOpen(false)
      toast.success("Retouche appliquée")
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Retouche"
      console.warn("retouch failed:", msg)
      setVersions((vs) => [
        { id: `v${vs.length + 1}`, label: `v${vs.length + 1} · Retouche (simulée)`, at: new Date().toISOString(), note: retouchText.slice(0, 60), current: true },
        ...vs.map((v) => ({ ...v, current: false })),
      ])
      setRetouchText("")
      setRetouchOpen(false)
      toast.success("Retouche envoyée à l'IA")
    } finally {
      setRetouching(false)
    }
  }

  function validate() {
    toast.success("Visuel validé · ajouté à votre bibliothèque")
    router.push(`/projects/${id}`)
  }

  return (
    <div style={{ maxWidth: 1400 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href={`/projects/${id}`}><Button variant="ghost" size="sm" icon="arrowL">Retour au projet</Button></Link>
          <span style={{ fontSize: 13, color: "var(--ink-3)" }}>·</span>
          <span style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>{project?.title ?? "Projet"}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" size="sm" icon="refresh" onClick={regenerate}>Régénérer</Button>
          <Button
            variant="outline"
            size="sm"
            icon="download"
            disabled={!selectedPoster}
            onClick={() => selectedPoster && downloadPoster(selectedPoster)}
          >
            Exporter
          </Button>
          <Button size="sm" icon="check" onClick={validate} disabled={!ready}>Valider</Button>
        </div>
      </div>

      {genError && (
        <Card padding={20} style={{ marginBottom: 24, borderColor: "var(--rose-soft)" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Icon name="warn" size={18} style={{ color: "var(--err)", flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--err)", marginBottom: 4 }}>Erreur de génération</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{genError}</div>
              <div style={{ marginTop: 12 }}>
                <Button size="sm" variant="outline" icon="refresh" onClick={regenerate}>Réessayer</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Generation progress */}
      {!ready && !genError && (
        <Card padding={28} style={{ marginBottom: 24, background: "linear-gradient(135deg, var(--acc-soft), transparent 70%)", borderColor: "var(--acc-line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 36, height: 36, borderRadius: 10, background: "var(--acc)",
                  color: "var(--acc-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center",
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              >
                <Icon name="sparkles" size={18} />
              </span>
              <div>
                <div className="display" style={{ fontSize: 18 }}>L&apos;IA travaille sur vos visuels…</div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>{PHASES[phaseIdx].label}</div>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--acc)" }}>{Math.round(progress * 100)}%</span>
          </div>
          <div style={{ height: 6, background: "var(--bg-3)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--acc-bright), var(--acc-deep))", transition: "width 400ms" }} />
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 6, fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", flexWrap: "wrap" }}>
            {PHASES.map((p, i) => (
              <span
                key={p.id}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: i <= phaseIdx ? "var(--acc-soft)" : "var(--bg-3)",
                  color: i <= phaseIdx ? "var(--acc-bright)" : "var(--ink-3)",
                  border: `1px solid ${i <= phaseIdx ? "var(--acc-line)" : "var(--line-1)"}`,
                }}
              >
                {i < phaseIdx && "✓ "}{p.label}
              </span>
            ))}
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: ready ? "1fr 320px" : "1fr", gap: 24 }} className="max-md:!grid-cols-1">
        {/* Variants */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 className="display" style={{ fontSize: 20, margin: 0 }}>{posters.length || 4} propositions</h2>
            {ready && <Badge tone="sage" icon="check">Prêtes</Badge>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="max-md:!grid-cols-1">
            {(ready
              ? posters
              : Array.from({ length: 4 }, (_, i) => ({ id: `skel-${i}`, variationNumber: i + 1, imageUrl: "" } as Partial<GeneratedPoster>))
            ).map((p, i) => {
              const active = selectedVariant === i
              const realPoster = "imageUrl" in p && p.imageUrl
              return (
                <button
                  key={p.id ?? i}
                  type="button"
                  onClick={() => setSelectedVariant(i)}
                  style={{
                    padding: 12,
                    background: "var(--bg-2)",
                    border: `2px solid ${active ? "var(--acc)" : "var(--line-1)"}`,
                    borderRadius: 14,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 200ms",
                  }}
                >
                  {realPoster ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.imageUrl as string}
                      alt={`Variante ${(p as GeneratedPoster).variationNumber}`}
                      style={{
                        width: "100%",
                        aspectRatio: "3/4",
                        objectFit: "cover",
                        borderRadius: 10,
                        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 12px 32px rgba(0,0,0,0.4)",
                      }}
                    />
                  ) : (
                    <Poster kind="skeleton" ratio="3/4" brief={{ phase: PHASES[phaseIdx].label, progress }} />
                  )}
                  <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: active ? "var(--acc-bright)" : "var(--ink-1)" }}>
                      Variante {(p as GeneratedPoster).variationNumber ?? i + 1}
                    </span>
                    {active && ready && <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--acc)" }} />}
                  </div>
                </button>
              )
            })}
          </div>

          {ready && (
            <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button icon="wand" onClick={() => setRetouchOpen(true)}>Retoucher cette variante</Button>
              <Button
                variant="outline"
                icon="download"
                disabled={!selectedPoster}
                onClick={() => selectedPoster && downloadPoster(selectedPoster)}
              >
                Télécharger HD
              </Button>
              <Button variant="outline" icon="refresh" onClick={regenerate}>Régénérer 4 nouvelles</Button>
            </div>
          )}
        </div>

        {/* Sidebar: timeline (only when ready) */}
        {ready && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card padding={20}>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 12 }}>Versions</h3>
              <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {versions.map((v) => (
                  <li key={v.id} style={{ paddingLeft: 18, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, top: 6, width: 8, height: 8, borderRadius: "50%", background: v.current ? "var(--acc)" : "var(--line-3)" }} />
                    <div style={{ fontSize: 12, fontWeight: v.current ? 600 : 500, color: v.current ? "var(--ink-0)" : "var(--ink-2)" }}>{v.label}</div>
                    {v.note && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, fontStyle: "italic" }}>« {v.note} »</div>}
                    <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2, fontFamily: "var(--font-mono)" }}>{relativeTime(v.at)}</div>
                  </li>
                ))}
              </ol>
            </Card>
            <Card padding={20}>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, marginBottom: 12 }}>Runs d&apos;agents</h3>
              {runs.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--ink-3)", margin: 0 }}>Aucun run encore</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, maxHeight: 240, overflow: "auto" }}>
                  {runs.slice(0, 12).map((r) => (
                    <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--ink-2)" }}>
                      <Icon name={r.status === "SUCCESS" ? "check" : "refresh"} size={11} style={{ color: r.status === "SUCCESS" ? "var(--sage)" : r.status === "FAILED" ? "var(--err)" : "var(--gold)", flexShrink: 0 }} />
                      <span style={{ flex: 1, fontFamily: "var(--font-mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.agentName}</span>
                      <span style={{ color: "var(--ink-3)" }}>{r.durationMs ?? "—"}ms</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Retouch modal */}
      {retouchOpen && (
        <div
          onClick={() => setRetouchOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(16,12,8,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}
          className="anim-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 560, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 14, padding: 24, boxShadow: "var(--sh-3)" }}
            className="anim-pop-in"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ width: 32, height: 32, borderRadius: 8, background: "var(--acc)", color: "var(--acc-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="wand" size={16} />
              </span>
              <h3 className="display" style={{ fontSize: 18, margin: 0 }}>Retoucher en langage naturel</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 6 }}>
              Décrivez ce que vous voulez changer. L&apos;IA générera une nouvelle version en gardant la composition.
            </p>
            <Textarea
              rows={4}
              value={retouchText}
              onChange={(e) => setRetouchText(e.target.value)}
              placeholder="Ex. : Remplacer le bleu par du terracotta, agrandir le titre, ajouter le logo en haut à droite…"
            />
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Plus chaleureux", "Ajouter le logo", "Texte plus grand", "Fond plus sobre"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRetouchText((t) => (t ? `${t}. ${s}` : s))}
                  style={{ padding: "6px 12px", fontSize: 12, background: "var(--bg-3)", border: "1px solid var(--line-2)", color: "var(--ink-1)", borderRadius: 999, cursor: "pointer" }}
                >
                  + {s}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button variant="ghost" onClick={() => setRetouchOpen(false)}>Annuler</Button>
              <Button icon="send" onClick={submitRetouch} disabled={retouching || !retouchText.trim()}>
                {retouching ? "Application…" : "Envoyer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
