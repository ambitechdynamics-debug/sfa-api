"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { fetchProjects } from "@/lib/projects"
import type { Project, ProjectStatus } from "@/types/project"
import { ApiError } from "@/lib/api"

const STATUS_TABS: Array<{ value: "ALL" | ProjectStatus; label: string }> = [
  { value: "ALL",        label: "Tous" },
  { value: "DRAFT",      label: "Brouillons" },
  { value: "GENERATING", label: "En cours" },
  { value: "GENERATED",  label: "Validés" },
  { value: "FAILED",     label: "Échec" },
]

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState<"ALL" | ProjectStatus>("ALL")

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch((e) => {
        const msg = e instanceof ApiError ? e.message : "Erreur de chargement"
        toast.error(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return projects
      .filter((p) => tab === "ALL" || p.status === tab)
      .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
  }, [projects, search, tab])

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: projects.length }
    for (const p of projects) c[p.status] = (c[p.status] ?? 0) + 1
    return c
  }, [projects])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1280 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <Input
            icon="search"
            placeholder="Rechercher un projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Link href="/create"><Button icon="plus">Nouveau projet</Button></Link>
      </div>

      {/* Status tabs */}
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--bg-2)", border: "1px solid var(--line-1)", borderRadius: 10, overflowX: "auto" }}>
        {STATUS_TABS.map((t) => {
          const active = tab === t.value
          const count = counts[t.value] ?? 0
          return (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "8px 14px",
                background: active ? "var(--bg-4)" : "transparent",
                border: 0,
                color: active ? "var(--ink-0)" : "var(--ink-2)",
                fontSize: 13, fontWeight: 500,
                borderRadius: 7, cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "background 150ms, color 150ms",
              }}
            >
              {t.label}
              <span style={{ fontSize: 11, padding: "1px 6px", borderRadius: 4, background: active ? "var(--bg-2)" : "var(--bg-3)", color: "var(--ink-2)" }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="anim-skeleton" style={{ height: 360, borderRadius: 14 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card padding={48} style={{ textAlign: "center" }}>
          <Icon name="folder" size={28} style={{ color: "var(--ink-3)", margin: "0 auto" }} />
          <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)" }}>
            {search ? `Aucun projet ne correspond à « ${search} »` : "Aucun projet pour le moment"}
          </p>
          {!search && (
            <Link href="/create" style={{ marginTop: 16, display: "inline-block" }}>
              <Button icon="sparkles">Créer mon premier visuel</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  )
}
