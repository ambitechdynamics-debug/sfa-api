import { createTravail, fetchTravaux } from "@/lib/projects"
import type { Project, Travail } from "@/types/project"

type ProjectIdentity = Pick<Project, "id" | "title">

function latestTravail(travaux: Travail[]) {
  return [...travaux].sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime()
    const bTime = new Date(b.updatedAt || b.createdAt).getTime()
    return bTime - aTime
  })[0]
}

export async function getProjectWorkspacePath(project: ProjectIdentity) {
  const travaux = await fetchTravaux(project.id)
  const existing = latestTravail(travaux)
  if (existing) return `/dashboard/t/${existing.id}`

  const travail = await createTravail(project.id, {
    title: project.title?.trim() || "Nouveau livrable",
  })
  return `/dashboard/t/${travail.id}`
}
