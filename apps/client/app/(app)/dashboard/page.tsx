"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { Poster } from "@/components/poster/Poster"
import { fetchProjects } from "@/lib/projects"
import { useAuthStore } from "@/store/auth-store"
import { ProjectCard } from "@/components/projects/ProjectCard"
import type { Project } from "@/types/project"
import { relativeTime } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const inProgress = projects.filter((p) => p.status !== "GENERATED" && p.status !== "FAILED")
  const recent = [...projects].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6)
  const firstName = user?.fullName.split(" ")[0] ?? "vous"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1280 }}>
      {/* Hero block */}
      <Card padding={32} style={{ background: "linear-gradient(135deg, var(--acc-soft), transparent 60%)", borderColor: "var(--acc-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 320px" }}>
            <Badge tone="acc" icon="sparkles" style={{ marginBottom: 12 }}>Prêt à créer</Badge>
            <h2 className="display" style={{ fontSize: 32, margin: 0, letterSpacing: "-0.02em" }}>
              Bonjour {firstName}, qu&apos;allons-nous créer aujourd&apos;hui ?
            </h2>
            <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)", maxWidth: 520, lineHeight: 1.55 }}>
              Lancez un nouveau brief en 7 étapes, ou reprenez l&apos;un de vos projets en cours.
            </p>
            <div style={{ marginTop: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Link href="/create"><Button size="lg" icon="sparkles">Créer un visuel</Button></Link>
              <Link href="/projects"><Button size="lg" variant="outline" iconRight="arrowR">Voir mes projets</Button></Link>
            </div>
          </div>
          <div style={{ width: 200, flexShrink: 0 }} className="max-md:hidden">
            <Poster kind="editorial" brief={{ title: "Votre\nProchain\nProjet", brand: "STUDIO", date: "à créer" }} ratio="3/4" />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <StatCard icon="folder" label="Projets" value={projects.length} hint={inProgress.length > 0 ? `${inProgress.length} en cours` : undefined} />
        <StatCard icon="credit" label="Crédits IA" value={user?.credits ?? 0} hint="Renouvellement le 4 du mois" />
        <StatCard icon="check" label="Validés" value={projects.filter((p) => p.status === "GENERATED").length} />
        <StatCard icon="zap" label="Plan" value={user?.role === "ADMIN" ? "Admin" : "Pro"} hint="Modifier dans Abonnement" />
      </div>

      {/* In-progress */}
      {inProgress.length > 0 && (
        <section>
          <SectionHead title="En cours" subtitle="Reprenez où vous étiez" href="/projects" />
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {inProgress.slice(0, 3).map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        </section>
      )}

      {/* Recent */}
      <section>
        <SectionHead title="Activité récente" subtitle={loading ? "Chargement…" : `${recent.length} projet(s)`} href="/projects" />
        {loading ? (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="anim-skeleton" style={{ height: 240, borderRadius: 14 }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Card padding={48} style={{ textAlign: "center", marginTop: 16 }}>
            <Icon name="folder" size={28} style={{ color: "var(--ink-3)", margin: "0 auto" }} />
            <p style={{ marginTop: 12, fontSize: 14, color: "var(--ink-2)" }}>Aucun projet pour le moment</p>
            <Link href="/create" style={{ marginTop: 16, display: "inline-block" }}>
              <Button icon="sparkles">Créer mon premier visuel</Button>
            </Link>
          </Card>
        ) : (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {recent.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>
    </div>
  )
}

function SectionHead({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
      <div>
        <h3 className="display" style={{ fontSize: 18, margin: 0 }}>{title}</h3>
        {subtitle && <p style={{ fontSize: 12, color: "var(--ink-3)", margin: "2px 0 0" }}>{subtitle}</p>}
      </div>
      {href && <Link href={href} style={{ fontSize: 13, color: "var(--acc)", display: "inline-flex", alignItems: "center", gap: 4 }}>Tout voir <Icon name="arrowR" size={12} /></Link>}
    </div>
  )
}

function StatCard({ icon, label, value, hint }: { icon: string; label: string; value: string | number; hint?: string }) {
  return (
    <Card padding={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>{label}</div>
          <div className="display" style={{ fontSize: 28, margin: "6px 0 0", letterSpacing: "-0.02em" }}>{value}</div>
          {hint && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>{hint}</div>}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--acc-soft)", border: "1px solid var(--acc-line)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--acc)" }}>
          <Icon name={icon} size={16} />
        </div>
      </div>
    </Card>
  )
}
