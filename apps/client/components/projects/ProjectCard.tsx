"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/Badge"
import { Poster, type PosterKind } from "@/components/poster/Poster"
import { Icon } from "@/components/ui/Icon"
import { relativeTime } from "@/lib/utils"
import { getProjectWorkspacePath } from "@/lib/project-navigation"
import type { Project } from "@/types/project"

// Pick a deterministic poster mock kind from project metadata
function pickKind(p: Project): PosterKind {
  const t = (p.brandDescription || p.title).toLowerCase()
  if (t.includes("menu") || t.includes("brunch")) return "menu"
  if (t.includes("drop") || t.includes("collection") || t.includes("launch")) return "launch"
  if (t.includes("solde") || t.includes("promo") || t.includes("sale")) return "sale"
  if (t.includes("corp") || t.includes("business") || t.includes("produit")) return "corp"
  if (t.includes("music") || t.includes("concert") || t.includes("live")) return "music"
  return "editorial"
}

export function ProjectCard({ project }: { project: Project }) {
  const router = useRouter()
  const [opening, setOpening] = useState(false)
  const kind = pickKind(project)
  const travauxCount = project._count?.travaux ?? project.travaux?.length ?? 0
  const brief = {
    title: project.title.split(" ").slice(0, 3).join(" ").replace(/(.{1,18}) /g, "$1\n").trim() || "Projet",
    brand: project.title.toUpperCase().slice(0, 12) || "STUDIO",
  }

  async function openProject() {
    if (opening) return
    setOpening(true)
    try {
      router.push(await getProjectWorkspacePath(project))
    } catch (err) {
      console.error("[project card] open failed", err)
      router.push("/dashboard")
    } finally {
      setOpening(false)
    }
  }

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      onClick={(e) => {
        e.preventDefault()
        void openProject()
      }}
      aria-busy={opening}
    >
      <div
        className="project-card"
        style={{
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)"
          e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.12)"
          e.currentTarget.style.background = "rgba(255,255,255,0.035)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)"
          e.currentTarget.style.background = "rgba(255,255,255,0.02)"
        }}
      >
        <div style={{ padding: 12, background: "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ borderRadius: 8, overflow: "hidden" }}>
            <Poster kind={kind} brief={brief} ratio="3/4" />
          </div>
        </div>
        <div style={{ padding: "16px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-0)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.01em" }}>
                {project.title}
              </h3>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "4px 0 0", fontWeight: 400 }}>
                {project.brandDescription || "Marque / Client"}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <Badge size="sm" tone="neutral" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {travauxCount} {travauxCount > 1 ? "travaux" : "travail"}
            </Badge>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-mono)" }}>
                {opening ? "Ouverture..." : relativeTime(project.updatedAt)}
              </span>
              <Icon name={opening ? "spinner" : "chevronR"} size={14} className={opening ? "animate-spin" : undefined} style={{ color: "rgba(255,255,255,0.3)" }} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
