import { create } from "zustand"
import {
  fetchProjects as apiFetchProjects,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
} from "@/services/project.service"
import type { Project } from "@/types/project"
import { ApiError } from "@/lib/api"

interface ProjectStoreState {
  projects: Project[]
  isLoading: boolean
  error: string
  loadProjects: () => Promise<void>
  addProject: (title: string) => Promise<Project>
  renameProject: (id: string, title: string) => Promise<void>
  removeProject: (id: string) => Promise<void>
  reset: () => void
}

export const useProjectStore = create<ProjectStoreState>((set) => ({
  projects: [],
  isLoading: false,
  error: "",

  loadProjects: async () => {
    set({ isLoading: true, error: "" })
    try {
      const projects = await apiFetchProjects()
      set({ projects, error: "" })
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        set({ projects: [], error: "" })
        return
      }
      set({
        projects: [],
        error: error instanceof Error ? error.message : "Impossible de charger les projets.",
      })
    } finally {
      set({ isLoading: false })
    }
  },

  addProject: async (title: string) => {
    const project = await apiCreateProject({ title })
    set((state) => ({ projects: [project, ...state.projects] }))
    return project
  },

  renameProject: async (id: string, title: string) => {
    await apiUpdateProject(id, { title })
    set((state) => ({
      projects: state.projects.map((project) => (project.id === id ? { ...project, title } : project)),
    }))
  },

  removeProject: async (id: string) => {
    await apiDeleteProject(id)
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    }))
  },

  reset: () => set({ projects: [], isLoading: false, error: "" }),
}))
