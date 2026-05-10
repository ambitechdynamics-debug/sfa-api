"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { Poster } from "@/components/poster/Poster"
import { fetchProject, fetchProjectMemories, deleteProject, fetchAgentRuns } from "@/lib/projects"
import { ApiError } from "@/lib/api"
import type { Project, MemoryEntry, AgentRun, ProjectStatus } from "@/types/project"
import { relativeTime } from "@/lib/utils"

const STATUS_TONES: Record<ProjectStatus, BadgeTone> = {
  DRAFT: "neutral", QUESTIONING: "acc", ANALYZING: "sky",
  READY_FOR_PROMPT: "gold", PROMPT_READY: "gold",
  GENERATING: "acc", GENERATED: "sage", FAILED: "rose",
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"infos" | "memories" | "history">("infos")

  useEffect(() => {
    Promise.all([fetchProject(id), fetchProjectMemories(id), fetchAgentRuns(id).catch(() => [] as AgentRun[])])
      .then(([p, mems, ar]) => {
        setProject(p)
        setMemories(mems)
        setRuns(ar)
      })
      .catch((e) => {
        const msg = e instanceof ApiError ? e.message : "Projet introuvable"
        toast.error(msg)
        router.replace("/projects")
      })
      .finally(() => setLoading(false))
  }, [id, router])

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ce projet ?")) return
    try {
      await deleteProject(id)
      toast.success("Projet supprimé")
      router.push("/projects")
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erreur"
      toast.error(msg)
    }
  }

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
        <div className="anim-skeleton" style={{ height: 600, borderRadius: 14 }} />
        <div className="anim-skeleton" style={{ height: 600, borderRadius: 14 }} />
      </div>
    )
  }
  if (!project) return null

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, maxWidth: 1280 }} className="max-md:!grid-cols-1">
      {/* Main */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Badge tone={STATUS_TONES[project.status]}>{project.status}</Badge>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{relativeTime(project.updatedAt)}</span>
            </div>
            <h1 className="display" style={{ fontSize: 28, margin: 0, letterSpacing: "-0.02em" }}>{project.title}</h1>
            {project.posterType && <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0 0" }}>{project.posterType}{project.format && ` · ${project.format}`}</p>}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(project.status === "DRAFT" || project.status === "QUESTIONING") && (
              <Link href={`/create?id=${project.id}`}><Button icon="edit">Continuer le brief</Button></Link>
            )}
            {project.status === "GENERATED" && (
              <Link href={`/projects/${project.id}/result`}><Button icon="image">Voir les résultats</Button></Link>
            )}
            <Button variant="danger" icon="trash" onClick={handleDelete}>Supprimer</Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 10 }}>
          {([
            ["infos", "Infos", "info"],
            ["memories", "Mémoires", "brush"],
            ["history", "Historique", "history"],
          ] as const).map(([v, label, ic]) => {
            const active = tab === v
            return (
              <button
                key={v}
                onClick={() => setTab(v)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  background: active ? "var(--bg-4)" : "transparent", border: 0,
                  color: active ? "var(--ink-0)" : "var(--ink-2)",
                  fontSize: 13, fontWeight: 500, borderRadius: 7, cursor: "pointer",
                }}
              >
                <Icon name={ic} size={14} /> {label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === "infos" && (
          <Card padding={24}>
            <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "12px 24px", margin: 0, fontSize: 14 }}>
              <dt style={{ color: "var(--ink-3)" }}>ID</dt>
              <dd style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-1)" }}>{project.id}</dd>
              <dt style={{ color: "var(--ink-3)" }}>Type</dt>
              <dd style={{ margin: 0, color: "var(--ink-0)" }}>{project.posterType ?? "—"}</dd>
              <dt style={{ color: "var(--ink-3)" }}>Catégorie</dt>
              <dd style={{ margin: 0, color: "var(--ink-0)" }}>{project.category ?? "—"}</dd>
              <dt style={{ color: "var(--ink-3)" }}>Format</dt>
              <dd style={{ margin: 0, color: "var(--ink-0)" }}>{project.format ?? "—"}</dd>
              <dt style={{ color: "var(--ink-3)" }}>Style</dt>
              <dd style={{ margin: 0, color: "var(--ink-0)" }}>{project.style ?? "—"}</dd>
              <dt style={{ color: "var(--ink-3)" }}>Créé</dt>
              <dd style={{ margin: 0, color: "var(--ink-0)" }}>{new Date(project.createdAt).toLocaleString("fr-FR")}</dd>
            </dl>
          </Card>
        )}

        {tab === "memories" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {memories.length === 0 ? (
              <Card padding={32} style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, color: "var(--ink-2)" }}>Aucune mémoire enregistrée</p>
              </Card>
            ) : memories.map((m) => (
              <Card key={m.id} padding={20}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <code style={{ fontSize: 12, color: "var(--acc)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{m.memoryDefinition?.key ?? m.memoryDefinitionId}</code>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{relativeTime(m.updatedAt)}</span>
                </div>
                <pre style={{ margin: 0, padding: 12, background: "var(--bg-1)", borderRadius: 8, fontSize: 12, color: "var(--ink-1)", overflow: "auto", maxHeight: 200, fontFamily: "var(--font-mono)" }}>
                  {JSON.stringify(m.content, null, 2)}
                </pre>
              </Card>
            ))}
          </div>
        )}

        {tab === "history" && (
          <Card padding={20}>
            {runs.length === 0 ? (
              <p style={{ fontSize: 14, color: "var(--ink-2)", textAlign: "center", padding: "24px 0" }}>Aucun run d&apos;agent enregistré</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {runs.map((r) => (
                  <li key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, background: "var(--bg-1)", borderRadius: 8, fontSize: 13 }}>
                    <Icon name={r.status === "SUCCESS" ? "check" : r.status === "FAILED" ? "warn" : "refresh"} size={14} style={{ color: r.status === "SUCCESS" ? "var(--sage)" : r.status === "FAILED" ? "var(--err)" : "var(--gold)", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontFamily: "var(--font-mono)" }}>{r.agentName}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.durationMs ? `${r.durationMs}ms` : "—"}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{relativeTime(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {/* Side preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card padding={16}>
          <Poster kind="editorial" brief={{ title: project.title.split(" ").slice(0, 3).join("\n"), brand: project.posterType || "STUDIO" }} ratio="3/4" />
        </Card>
        <Card padding={16}>
          <h4 style={{ fontSize: 13, margin: "0 0 8px", fontWeight: 600 }}>Actions rapides</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <Button variant="outline" size="sm" full icon="download">Télécharger</Button>
            <Button variant="outline" size="sm" full icon="share">Partager</Button>
            <Button variant="outline" size="sm" full icon="copy">Dupliquer</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
