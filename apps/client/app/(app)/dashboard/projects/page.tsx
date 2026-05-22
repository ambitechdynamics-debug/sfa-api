"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { PageContainer } from "@/components/app/dashboard-ui"
import { CreateProjectModal } from "@/components/app/CreateProjectModal"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { useProjectStore } from "@/store/project-store"
import { Icon } from "@/components/ui/Icon"

const PROJECT_SKELETONS = ["project-skeleton-1", "project-skeleton-2", "project-skeleton-3", "project-skeleton-4", "project-skeleton-5", "project-skeleton-6"]

function ProjectSkeleton() {
  return (
    <div 
      className="anim-skeleton" 
      style={{ 
        minHeight: 286, 
        borderRadius: 16, 
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.04)"
      }} 
    />
  )
}

export default function DashboardProjectsPage() {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "DRAFT" | "GENERATING" | "GENERATED">("all")
  const { error, isLoading, loadProjects, projects } = useProjectStore()

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  const filteredProjects = projects
    .filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((p) => filterStatus === "all" || p.status === filterStatus)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <PageContainer width={1180} style={{ padding: "12px clamp(16px, 3vw, 32px) 48px" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(24px, 3vw, 32px)", letterSpacing: "-0.02em", fontWeight: 600, color: "var(--ink-0)" }}>
              Vos Projets
            </h1>
            <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.4)", fontSize: 14, maxWidth: 500 }}>
              Retrouvez et gérez l'ensemble de vos créations, briefs et générations visuelles.
            </p>
          </div>
          <Button icon="plus" onClick={() => setCreateOpen(true)} style={{ borderRadius: 999, padding: "0 20px" }}>
            Nouveau projet
          </Button>
        </div>

        {/* Barre de filtres et recherche */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          gap: 16, 
          flexWrap: "wrap",
          padding: "12px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <FilterChip active={filterStatus === "all"} onClick={() => setFilterStatus("all")}>Tous</FilterChip>
            <FilterChip active={filterStatus === "GENERATED"} onClick={() => setFilterStatus("GENERATED")}>Validés</FilterChip>
            <FilterChip active={filterStatus === "GENERATING"} onClick={() => setFilterStatus("GENERATING")}>En cours</FilterChip>
            <FilterChip active={filterStatus === "DRAFT"} onClick={() => setFilterStatus("DRAFT")}>Brouillons</FilterChip>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            background: "rgba(255,255,255,0.04)", 
            borderRadius: 999,
            padding: "0 14px",
            border: "1px solid rgba(255,255,255,0.06)",
            minWidth: 260
          }}>
            <Icon name="search" size={16} style={{ color: "rgba(255,255,255,0.3)" }} />
            <input 
              type="text" 
              placeholder="Rechercher un projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent", border: "none", outline: "none", color: "var(--ink-0)",
                padding: "10px 12px", fontSize: 13, width: "100%"
              }}
            />
          </div>
        </div>
      </header>

      {error ? (
        <PremiumEmptyState
          icon="warn"
          title="Erreur de chargement"
          body={error}
          action={<Button variant="outline" icon="refresh" onClick={() => void loadProjects()}>Réessayer</Button>}
        />
      ) : isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {PROJECT_SKELETONS.map((id) => (
            <ProjectSkeleton key={id} />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <PremiumEmptyState
          icon="folder"
          title={searchQuery ? "Aucun projet trouvé" : "Vous n'avez aucun projet"}
          body={searchQuery ? `Aucun résultat pour "${searchQuery}" avec ces filtres.` : "Commencez par créer votre premier projet pour générer de superbes visuels."}
          action={
            !searchQuery && filterStatus === "all" ? (
              <Button icon="plus" onClick={() => setCreateOpen(true)} style={{ borderRadius: 999 }}>
                Créer un projet
              </Button>
            ) : (
              <Button variant="outline" onClick={() => { setSearchQuery(""); setFilterStatus("all") }} style={{ borderRadius: 999 }}>
                Réinitialiser les filtres
              </Button>
            )
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </PageContainer>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        background: active ? "#fff" : "transparent",
        color: active ? "#000" : "rgba(255,255,255,0.5)",
        border: active ? "1px solid #fff" : "1px solid transparent",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.9)"
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = "rgba(255,255,255,0.5)"
      }}
    >
      {children}
    </button>
  )
}

function PremiumEmptyState({ icon, title, body, action }: { icon: string; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div style={{ 
      padding: "64px 32px", 
      textAlign: "center", 
      background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
      border: "1px dashed rgba(255,255,255,0.1)",
      borderRadius: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginTop: 20
    }}>
      <div style={{ 
        width: 56, height: 56, 
        borderRadius: 16, 
        background: "rgba(255,255,255,0.03)", 
        border: "1px solid rgba(255,255,255,0.08)", 
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,0.6)"
      }}>
        <Icon name={icon} size={24} />
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--ink-0)", letterSpacing: "-0.01em" }}>{title}</h3>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 380, lineHeight: 1.5 }}>{body}</p>
      </div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
