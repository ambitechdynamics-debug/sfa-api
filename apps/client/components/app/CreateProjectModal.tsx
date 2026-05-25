"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { useProjectStore } from "@/store/project-store"
import { getProjectWorkspacePath } from "@/lib/project-navigation"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const addProject = useProjectStore((s) => s.addProject)
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError("")
    try {
      const project = await addProject(projectName)
      setProjectName("")
      onClose()
      router.push(await getProjectWorkspacePath(project))
    } catch {
      setError("Impossible de créer le projet. Vérifiez votre connexion.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: "var(--bg-1)",
          border: "1px solid var(--line-2)",
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--ink-0)", margin: 0 }}>
            Créer un projet
          </h2>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              style={{ background: "transparent", border: 0, color: "var(--ink-3)", cursor: "pointer" }}
              className="hover:text-[var(--ink-1)]"
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label htmlFor="project-name" style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-0)" }}>
              Nom du projet
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--bg-0)",
                border: "1px solid var(--line-2)",
                borderRadius: 10,
                padding: "0 12px",
                height: 44,
              }}
              className="focus-within:border-[var(--line-3)] transition-colors"
            >
              <Icon name="sparkles" size={18} style={{ color: "var(--ink-3)" }} />
              <input
                id="project-name"
                type="text"
                placeholder="Nom du projet..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                autoFocus
                style={{
                  flex: 1,
                  background: "transparent",
                  border: 0,
                  color: "var(--ink-0)",
                  fontSize: 15,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 13, color: "var(--err)", padding: "8px 12px", background: "rgba(255,60,60,0.08)", borderRadius: 8 }}>
              {error}
            </div>
          )}

          <div
            style={{
              background: "var(--bg-2)",
              borderRadius: 10,
              padding: 16,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <Icon name="info" size={20} color="var(--ink-2)" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-1)", lineHeight: 1.5 }}>
              Les projets permettent de regrouper les chats, les fichiers et les instructions
              personnalisées en un seul endroit. Utilisez-les pour accéder facilement aux travaux en
              cours ou pour organiser vos tâches.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <button
              type="submit"
              disabled={!projectName.trim() || isSubmitting}
              style={{
                background: "#a39e93",
                color: "#111111",
                border: 0,
                borderRadius: 20,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 600,
                cursor: projectName.trim() && !isSubmitting ? "pointer" : "not-allowed",
                opacity: projectName.trim() && !isSubmitting ? 1 : 0.6,
                transition: "opacity 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {isSubmitting && <Icon name="spinner" size={14} className="animate-spin" />}
              {isSubmitting ? "Création..." : "Créer un projet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
