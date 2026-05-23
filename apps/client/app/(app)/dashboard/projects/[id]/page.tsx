"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Icon } from "@/components/ui/Icon"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { createTravail, fetchProject } from "@/lib/projects"
import type { Project, Travail } from "@/types/project"
import { relativeTime } from "@/lib/utils"

type ProjectWithTravaux = Project & { travaux?: Travail[] }

const STATUS_LABEL: Record<Travail["status"], string> = {
  DRAFT: "Brouillon",
  QUESTIONING: "Brief en cours",
  ANALYZING: "Analyse",
  READY_FOR_PROMPT: "Prêt à générer",
  PROMPT_READY: "Prompt prêt",
  GENERATING: "En génération",
  GENERATED: "Validé",
  FAILED: "Échec",
}

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<ProjectWithTravaux | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchProject(id)
      .then((p) => {
        if (!cancelled) setProject(p as ProjectWithTravaux)
      })
      .catch(() => {
        if (!cancelled) router.replace("/dashboard")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  async function handleCreateTravail() {
    if (!project) return
    setCreating(true)
    try {
      const travail = await createTravail(project.id, { title: "Nouveau livrable" })
      toast.success("Travail créé")
      router.push(`/dashboard/t/${travail.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de créer le travail")
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: 420, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Icon name="spinner" className="animate-spin" size={24} color="var(--ink-3)" />
      </div>
    )
  }

  if (!project) return null

  const travaux = project.travaux ?? []

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Badge tone="neutral" icon="folder" style={{ marginBottom: 10 }}>Marque · Client</Badge>
          <h1 className="display" style={{ fontSize: 32, margin: 0, letterSpacing: "-0.01em" }}>{project.title}</h1>
          {project.brandDescription && (
            <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 8, maxWidth: 620, lineHeight: 1.55 }}>
              {project.brandDescription}
            </p>
          )}
        </div>
        <Button icon="plus" onClick={handleCreateTravail} disabled={creating}>
          {creating ? "Création…" : "Nouveau travail"}
        </Button>
      </header>

      <section>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-1)", marginBottom: 12 }}>
          Travaux ({travaux.length})
        </h2>
        {travaux.length === 0 ? (
          <Card padding={32} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Icon name="layers" size={32} style={{ color: "var(--ink-3)" }} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-0)" }}>Aucun travail pour cette marque</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
                Créez un livrable pour commencer (flyer, story, menu, etc.).
              </div>
            </div>
            <Button icon="plus" onClick={handleCreateTravail} disabled={creating}>Créer un travail</Button>
          </Card>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {travaux.map((travail) => (
              <Card
                key={travail.id}
                padding={16}
                style={{ cursor: "pointer", transition: "all 200ms" }}
                onClick={() => router.push(`/dashboard/t/${travail.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"
                  e.currentTarget.style.background = "rgba(255,255,255,0.035)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ""
                  e.currentTarget.style.background = ""
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: "var(--ink-0)" }}>{travail.title}</h3>
                  <Badge size="sm" tone={travail.status === "GENERATED" ? "sage" : travail.status === "FAILED" ? "rose" : "neutral"}>
                    {STATUS_LABEL[travail.status]}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {travail.posterType && <span>{travail.posterType}</span>}
                  {travail.format && <span>· {travail.format}</span>}
                  <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>{relativeTime(travail.updatedAt)}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
