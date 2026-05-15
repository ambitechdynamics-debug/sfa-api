"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Icon } from "@/components/ui/Icon"
import { fetchUxMetricsSummary, submitSatisfaction } from "@/lib/ux-metrics"
import { fetchProjects } from "@/lib/projects"
import { ApiError } from "@/lib/api"
import { relativeTime } from "@/lib/utils"
import { useAuthStore } from "@/store/auth-store"
import type { Project } from "@/types/project"
import type { UxMetricSummary } from "@/types/ux-metrics"

const SCORE_LABELS: Record<number, string> = {
  1: "Bloquant",
  2: "Difficile",
  3: "Correct",
  4: "Fluide",
  5: "Excellent",
}

export default function MetricsPage() {
  const user = useAuthStore((state) => state.user)
  const [summary, setSummary] = useState<UxMetricSummary | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState<number | null>(null)

  async function loadSummary() {
    setLoading(true)
    try {
      const [data, projectData] = await Promise.all([
        fetchUxMetricsSummary(),
        fetchProjects().catch(() => [] as Project[]),
      ])
      setSummary(data)
      setProjects(projectData)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Métriques indisponibles"
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSummary()
  }, [])

  async function submitScore() {
    if (!score) return
    setSubmitting(true)
    try {
      await submitSatisfaction(score, { surface: "metrics-page" })
      toast.success("Score enregistré")
      setScore(null)
      await loadSummary()
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Enregistrement impossible"
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const topRoute = useMemo(() => summary?.routeBreakdown[0], [summary])
  const activeProjects = projects.filter((project) => project.status !== "GENERATED" && project.status !== "FAILED").length
  const generatedProjects = projects.filter((project) => project.status === "GENERATED").length
  const failedProjects = projects.filter((project) => project.status === "FAILED").length
  const successRate = generatedProjects + failedProjects === 0
    ? null
    : Math.round((generatedProjects / (generatedProjects + failedProjects)) * 100)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 1120, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Badge tone="acc" icon="trend" style={{ marginBottom: 10 }}>Fenêtre {summary?.windowDays ?? 30} jours</Badge>
          <h2 className="display" style={{ fontSize: 30, margin: 0, letterSpacing: 0 }}>Vos métriques</h2>
          <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "8px 0 0", maxWidth: 620, lineHeight: 1.55 }}>
            Activité personnelle, crédits, créations et satisfaction. Les métriques globales restent dans l&apos;admin.
          </p>
        </div>
        <Button variant="outline" icon="refresh" onClick={loadSummary} disabled={loading}>
          {loading ? "Actualisation…" : "Actualiser"}
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <MetricCard icon="folder" label="Créations" value={projects.length} hint={`${activeProjects} projet(s) actif(s)`} />
        <MetricCard icon="check" label="Succès génération" value={successRate == null ? "—" : `${successRate}%`} hint={`${generatedProjects} finalisée(s)`} />
        <MetricCard icon="download" label="Exports réalisés" value={summary?.exportCount ?? 0} hint="Téléchargements suivis" />
        <MetricCard icon="credit" label="Crédits restants" value={user?.credits ?? "—"} hint="Solde utilisateur" />
        <MetricCard icon="heart" label="Satisfaction" value={summary?.satisfactionRate == null ? "—" : `${summary.satisfactionRate}%`} hint={summary?.satisfactionAverage == null ? "Aucun score" : `${summary.satisfactionAverage}/5 sur ${summary.satisfactionCount} vote(s)`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 18 }} className="max-md:!grid-cols-1">
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div style={{ padding: 20, borderBottom: "1px solid var(--line-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <h3 className="display" style={{ fontSize: 19, margin: 0, letterSpacing: 0 }}>Routes consultées</h3>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 0" }}>{summary?.totalEvents ?? 0} événement(s) enregistrés</p>
            </div>
          </div>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="anim-skeleton" style={{ height: 42, borderRadius: 8 }} />)
            ) : summary && summary.routeBreakdown.length > 0 ? (
              summary.routeBreakdown.map((route) => (
                <div key={route.path} style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 70px", gap: 12, alignItems: "center" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>{route.path}</div>
                    <div style={{ height: 5, marginTop: 7, background: "var(--bg-1)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (route.count / Math.max(1, summary.routeBreakdown[0].count)) * 100)}%`, height: "100%", background: "linear-gradient(90deg, var(--acc-bright), var(--acc-deep))" }} />
                    </div>
                  </div>
                  <span style={{ justifySelf: "end", fontSize: 12, color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>{route.count} vue(s)</span>
                </div>
              ))
            ) : (
              <EmptyState icon="trend" text="Aucune route enregistrée pour le moment." />
            )}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card padding={20}>
            <h3 className="display" style={{ fontSize: 19, margin: 0, letterSpacing: 0 }}>Satisfaction</h3>
            <p style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, margin: "8px 0 14px" }}>
              Évaluez la fluidité de navigation actuelle.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
              {[1, 2, 3, 4, 5].map((value) => {
                const active = score === value
                return (
                  <button
                    key={value}
                    type="button"
                    title={SCORE_LABELS[value]}
                    onClick={() => setScore(value)}
                    style={{
                      height: 42,
                      borderRadius: 8,
                      border: active ? "1px solid var(--acc-line)" : "1px solid var(--line-1)",
                      background: active ? "var(--acc-soft)" : "var(--bg-1)",
                      color: active ? "var(--acc-bright)" : "var(--ink-2)",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{score ? SCORE_LABELS[score] : "Choisir un score"}</span>
              <Button size="sm" icon="send" onClick={submitScore} disabled={!score || submitting}>
                {submitting ? "Envoi…" : "Envoyer"}
              </Button>
            </div>
          </Card>

          <Card padding={0} style={{ overflow: "hidden" }}>
            <div style={{ padding: 18, borderBottom: "1px solid var(--line-1)" }}>
              <h3 className="display" style={{ fontSize: 18, margin: 0, letterSpacing: 0 }}>Événements récents</h3>
            </div>
            <div style={{ maxHeight: 360, overflow: "auto" }}>
              {loading ? (
                <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="anim-skeleton" style={{ height: 36, borderRadius: 8 }} />)}
                </div>
              ) : summary && summary.recentEvents.length > 0 ? (
                summary.recentEvents.map((event) => (
                  <div key={event.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-1)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Icon name={eventIcon(event.eventType)} size={15} style={{ color: eventColor(event.eventType), marginTop: 2, flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ink-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.eventType} · {event.path}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>{relativeTime(event.createdAt)}{event.durationMs ? ` · ${formatDuration(event.durationMs)}` : ""}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState icon="history" text="Aucun événement récent." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, hint, tone }: { icon: string; label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <Card padding={18}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>{label}</div>
          <div className="display" style={{ fontSize: 27, marginTop: 8, letterSpacing: 0, color: tone ?? "var(--ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{value}</div>
          {hint && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hint}</div>}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--acc-soft)", border: "1px solid var(--acc-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc-bright)", flexShrink: 0 }}>
          <Icon name={icon} size={15} />
        </div>
      </div>
    </Card>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ padding: 28, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
      <Icon name={icon} size={24} style={{ margin: "0 auto 10px" }} />
      {text}
    </div>
  )
}

function formatDuration(ms?: number | null) {
  if (ms == null) return "—"
  if (ms < 1000) return `${ms} ms`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`
}

function eventIcon(type: string) {
  if (type === "SATISFACTION") return "check"
  if (type === "NAVIGATION_ERROR") return "warn"
  if (type === "NAVIGATION") return "arrowR"
  return "eye"
}

function eventColor(type: string) {
  if (type === "SATISFACTION") return "var(--sage)"
  if (type === "NAVIGATION_ERROR") return "var(--rose)"
  if (type === "NAVIGATION") return "var(--acc)"
  return "var(--sky)"
}
