"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@/components/ui/Icon"
import { getProjectWorkspacePath } from "@/lib/project-navigation"

export default function ProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    void getProjectWorkspacePath({ id, title: "Nouveau livrable" })
      .then((path) => {
        if (!cancelled) router.replace(path)
      })
      .catch((err) => {
        console.error("[project redirect] failed", err)
        if (!cancelled) router.replace("/dashboard")
      })
    return () => {
      cancelled = true
    }
  }, [id, router])

  return (
    <div style={{ minHeight: 420, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Icon name="spinner" className="animate-spin" size={24} color="var(--ink-3)" />
    </div>
  )
}
