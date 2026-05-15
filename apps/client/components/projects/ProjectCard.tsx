"use client"

import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { Poster, type PosterKind } from "@/components/poster/Poster"
import { Icon } from "@/components/ui/Icon"
import { relativeTime } from "@/lib/utils"
import type { Project, ProjectStatus } from "@/types/project"

const STATUS_LABELS: Record<ProjectStatus, { label: string; tone: BadgeTone }> = {
  DRAFT:            { label: "Brouillon",     tone: "neutral" },
  QUESTIONING:      { label: "Brief en cours",tone: "acc" },
  ANALYZING:        { label: "Analyse",       tone: "sky" },
  READY_FOR_PROMPT: { label: "Prêt à générer",tone: "gold" },
  PROMPT_READY:     { label: "Prompt prêt",   tone: "gold" },
  GENERATING:       { label: "En génération", tone: "acc" },
  GENERATED:        { label: "Validé",        tone: "sage" },
  FAILED:           { label: "Échec",         tone: "rose" },
}

// Pick a deterministic poster mock kind from project metadata
function pickKind(p: Project): PosterKind {
  const t = (p.posterType || p.style || p.title).toLowerCase()
  if (t.includes("menu") || t.includes("brunch")) return "menu"
  if (t.includes("drop") || t.includes("collection") || t.includes("launch")) return "launch"
  if (t.includes("solde") || t.includes("promo") || t.includes("sale")) return "sale"
  if (t.includes("corp") || t.includes("business") || t.includes("produit")) return "corp"
  if (t.includes("music") || t.includes("concert") || t.includes("live")) return "music"
  return "editorial"
}

export function ProjectCard({ project }: { project: Project }) {
  const kind = pickKind(project)
  const status = STATUS_LABELS[project.status]
  const brief = {
    title: project.title.split(" ").slice(0, 3).join(" ").replace(/(.{1,18}) /g, "$1\n").trim() || "Projet",
    brand: project.posterType || "STUDIO",
  }

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card hover style={{ overflow: "hidden", padding: 0, display: "flex", flexDirection: "column", gap: 0 }}>
        <div style={{ padding: 14, background: "var(--bg-3)" }}>
          <Poster kind={kind} brief={brief} ratio="3/4" />
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--line-1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-0)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.title}</h3>
              <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "4px 0 0" }}>
                {project.posterType || "Affiche"}{project.format ? ` · ${project.format}` : ""}
              </p>
            </div>
            <Badge size="sm" tone={status.tone}>{status.label}</Badge>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--line-1)" }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{relativeTime(project.updatedAt)}</span>
            <Icon name="chevronR" size={14} style={{ color: "var(--ink-3)" }} />
          </div>
        </div>
      </Card>
    </Link>
  )
}
