"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatConversation } from "@/components/app/ChatConversation"
import { Icon } from "@/components/ui/Icon"
import { fetchProject } from "@/lib/projects"
import { useProjectStore } from "@/store/project-store"
import type { Project } from "@/types/project"

export default function ProjectChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { projects } = useProjectStore()
  const localProject = projects.find((project) => project.id === id)
  const [project, setProject] = useState<Project | null>(localProject ?? null)
  const [loadingProject, setLoadingProject] = useState(!localProject)

  useEffect(() => {
    let cancelled = false

    if (localProject) {
      setProject(localProject)
      setLoadingProject(false)
      return
    }

    setLoadingProject(true)
    fetchProject(id)
      .then((nextProject) => {
        if (!cancelled) setProject(nextProject)
      })
      .catch(() => {
        if (!cancelled) router.replace("/dashboard")
      })
      .finally(() => {
        if (!cancelled) setLoadingProject(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, localProject, router])

  if (loadingProject) {
    return (
      <div style={{ minHeight: 420, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Icon name="spinner" className="animate-spin" size={24} color="var(--ink-3)" />
      </div>
    )
  }

  return (
    <ChatConversation
      projectId={id}
      initialTitle={project?.title ? `Projet · ${project.title}` : "Projet · Conversation IA"}
    />
  )
}
