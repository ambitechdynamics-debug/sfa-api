"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { EmptyState, PageContainer } from "@/components/app/dashboard-ui"
import { CreateProjectModal } from "@/components/app/CreateProjectModal"
import { ProjectCard } from "@/components/projects/ProjectCard"
import { useProjectStore } from "@/store/project-store"

const PROJECT_SKELETONS = ["project-skeleton-1", "project-skeleton-2", "project-skeleton-3", "project-skeleton-4", "project-skeleton-5", "project-skeleton-6"]

function ProjectSkeleton() {
  return (
    <div className="anim-skeleton" style={{ minHeight: 286, borderRadius: 14 }} />
  )
}

export default function DashboardProjectsPage() {
  const [isCreateOpen, setCreateOpen] = useState(false)
  const { error, isLoading, loadProjects, projects } = useProjectStore()

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  return (
    <PageContainer width={1180} style={{ padding: "4px clamp(8px, 2vw, 16px) 32px" }}>
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
        <div>
          <h1 className="display" style={{ margin: 0, fontSize: "clamp(28px, 3vw, 42px)", letterSpacing: 0 }}>
            Projets
          </h1>
          <p style={{ margin: "8px 0 0", color: "var(--ink-3)", fontSize: 14, lineHeight: 1.55, maxWidth: 560 }}>
            Retrouvez les créations, fichiers et conversations liées à votre compte.
          </p>
        </div>
        <Button icon="plus" onClick={() => setCreateOpen(true)}>
          Nouveau projet
        </Button>
      </header>

      {error ? (
        <EmptyState
          icon="warn"
          title="Impossible de charger les projets"
          body={error}
          action={
            <Button variant="outline" icon="refresh" onClick={() => void loadProjects()}>
              Réessayer
            </Button>
          }
        />
      ) : isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {PROJECT_SKELETONS.map((id) => (
            <ProjectSkeleton key={id} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Aucun projet"
          body="Créez un projet pour regrouper vos briefs, fichiers et générations visuelles."
          action={
            <Button icon="plus" onClick={() => setCreateOpen(true)}>
              Créer un projet
            </Button>
          }
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setCreateOpen(false)} />
    </PageContainer>
  )
}
