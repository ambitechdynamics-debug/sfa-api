"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, LogOut, Settings, UserRound } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjectStore } from "@/store/project-store"
import { useCreationOptionsStore } from "@/store/creation-options-store"
import { createTravail, uploadProjectFile } from "@/lib/projects"
import { getProjectWorkspacePath } from "@/lib/project-navigation"
import type { Project } from "@/types/project"
import { ConsiliumPrismLogo } from "@/components/brand/ConsiliumPrismLogo"
import { AssetImportPanel, type PendingAsset } from "./AssetImportPanel"

const USAGE_MAP: Record<PendingAsset["type"], string> = {
  logo: "LOGO",
  product: "PRODUCT_IMAGE",
  reference: "REFERENCE_IMAGE",
  poster: "GENERATED_POSTER",
  character: "PERSON_IMAGE",
  other: "OTHER",
}

/**
 * Default visual types used when CreationOption is empty
 * (for example: unseeded DB, offline API).
 */
const DEFAULT_VISUAL_TYPES = [
  { id: "default-flyer",        slug: "flyer",        name: "Flyer" },
  { id: "default-poster",       slug: "poster",       name: "Poster" },
  { id: "default-social-post",  slug: "social_post",  name: "Social post" },
  { id: "default-social-story", slug: "story",        name: "Story Instagram / Reel" },
  { id: "default-card",         slug: "business_card", name: "Business card" },
  { id: "default-banner",       slug: "banner",       name: "Web banner" },
  { id: "default-menu",         slug: "menu",         name: "Restaurant menu" },
] as const

/**
 * Supported poster shapes. The slug is passed to `createTravail.format`
 * and resolved by the backend through `ratioFromFormat`
 * (apps/SFA-API/src/modules/image-generation/imageGen.service.ts).
 */
const FORMAT_SHAPES = [
  { slug: "3:4",  name: "Portrait — 3:4",  hint: "Flyer · Poster · A4" },
  { slug: "1:1",  name: "Square — 1:1",    hint: "Instagram · Facebook" },
  { slug: "9:16", name: "Story — 9:16",    hint: "Story · Reels · TikTok" },
  { slug: "16:9", name: "Banner — 16:9",   hint: "YouTube · Web banner" },
  { slug: "4:3",  name: "Landscape — 4:3", hint: "Presentation · Ad" },
] as const

/* ── Tiny icons (Lucide-style) ── */
const Ico = {
  palette: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22a10 10 0 1 1 10-10 4 4 0 0 1-4 4h-1.5a2.5 2.5 0 0 0-2 4 2.5 2.5 0 0 1-2.5 2Z" />
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  ),
  search: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
    </svg>
  ),
  folder: ({ size = 36, color = "#8B5CF6" }: { size?: number; color?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2h9A1.5 1.5 0 0 1 21 9.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18Z" />
    </svg>
  ),
  plus: ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  chevron: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  x: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  docs: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  ),
}

/** Dessine un mini rectangle au ratio de la forme — visuel rapide dans le picker */
function ShapeIcon({ slug }: { slug: string }) {
  const ratios: Record<string, { w: number; h: number }> = {
    "1:1":  { w: 14, h: 14 },
    "9:16": { w: 9,  h: 16 },
    "3:4":  { w: 12, h: 16 },
    "16:9": { w: 18, h: 10 },
    "4:3":  { w: 18, h: 13.5 },
  }
  const { w, h } = ratios[slug] ?? ratios["3:4"]
  const x = (20 - w) / 2
  const y = (20 - h) / 2
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="2"
        stroke="#8B5CF6"
        strokeWidth="1.6"
        fill="rgba(139,92,246,0.18)"
      />
    </svg>
  )
}

function timeAgo(iso: string | undefined): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} d`
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

export function UserNewDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { projects, isLoading, error, loadProjects, removeProject } = useProjectStore()
  const addProject = useProjectStore((s) => s.addProject)
  const { options, fetchOptions } = useCreationOptionsStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const mobileUserMenuRef = useRef<HTMLDivElement | null>(null)
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      const isInsideDesktop = userMenuRef.current?.contains(target)
      const isInsideMobile = mobileUserMenuRef.current?.contains(target)
      if (!isInsideDesktop && !isInsideMobile) {
        setUserMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [userMenuOpen])

  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [systemId, setSystemId] = useState<string>("")
  const [formatSlug, setFormatSlug] = useState<string>(FORMAT_SHAPES[0].slug)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    void loadProjects()
    void fetchOptions()
  }, [loadProjects, fetchOptions])

  // Defensive: stores can transiently return undefined during boot or malformed API responses.
  const safeOptions = Array.isArray(options) ? options : []
  const safeProjects = Array.isArray(projects) ? projects : []

  // Fallback: if the backend returns no type, keep project creation available.
  const visualTypes: Array<{ id: string; slug: string; name: string }> =
    safeOptions.length > 0
      ? safeOptions.map((o) => ({ id: o.id, slug: o.slug, name: o.name }))
      : [...DEFAULT_VISUAL_TYPES]

  // Default visual type once the list is available
  useEffect(() => {
    if (visualTypes.length > 0 && !systemId) setSystemId(visualTypes[0].slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualTypes.length, systemId])

  const selectedSystem = visualTypes.find((o) => o.slug === systemId)

  function cycleSystem() {
    if (visualTypes.length === 0) return
    const idx = visualTypes.findIndex((o) => o.slug === systemId)
    const next = visualTypes[(idx + 1) % visualTypes.length]
    setSystemId(next.slug)
  }

  const selectedShape = FORMAT_SHAPES.find((s) => s.slug === formatSlug) ?? FORMAT_SHAPES[0]
  function cycleShape() {
    const idx = FORMAT_SHAPES.findIndex((s) => s.slug === formatSlug)
    const next = FORMAT_SHAPES[(idx + 1) % FORMAT_SHAPES.length]
    setFormatSlug(next.slug)
  }

  const filteredProjects = safeProjects
    .filter((p) => (p?.title ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b?.updatedAt ?? 0).getTime() - new Date(a?.updatedAt ?? 0).getTime())

  async function handleCreate() {
    const cleanName = name.trim()
    if (!cleanName || !user?.id || isCreating) return
    setIsCreating(true)
    setCreateError(null)
    try {
      const project = await addProject(cleanName)

      // Upload pending assets to the freshly created project (best-effort,
      // failures are logged but do not block project creation).
      if (pendingAssets.length > 0) {
        await Promise.allSettled(
          pendingAssets.map((a) => uploadProjectFile(project.id, a.file, USAGE_MAP[a.type] ?? "OTHER"))
        )
      }

      const travail = await createTravail(project.id, {
        title: cleanName,
        posterType: systemId || "flyer",
        format: formatSlug,
      })
      const travailId = (travail as { id?: string })?.id

      // Clear pending assets local state
      setPendingAssets([])

      if (travailId) {
        router.push(`/dashboard/t/${travailId}`)
      } else {
        router.push(await getProjectWorkspacePath(project))
      }
    } catch (err) {
      console.error("[user-new dashboard] create failed", err)
      setCreateError(err instanceof Error ? err.message : "Unable to create. Try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const initials = (user?.fullName ?? "AD")
    .split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()

  async function openProject(project: Project) {
    try {
      router.push(await getProjectWorkspacePath(project))
    } catch (err) {
      console.error("[user-new dashboard] open project failed", err)
      router.push("/dashboard")
    }
  }

  return (
    <div className="csl-app-dashboard">
      <header className="csl-dashboard-mobile-top">
        <div className="csl-dashboard-mobile-spacer" aria-hidden="true" />
        <div className="csl-dashboard-mobile-brand">
          <ConsiliumPrismLogo size={28} className="csl-dashboard-mobile-brand-logo" />
          <span>
            <strong>CONSILIUM</strong>
            <small>Design</small>
          </span>
        </div>
        <div className="csl-dashboard-mobile-account" ref={mobileUserMenuRef}>
          <button
            type="button"
            className="csl-dashboard-mobile-menu"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-label="Open account menu"
            aria-expanded={userMenuOpen}
          >
            <ConsiliumPrismLogo size={28} className="csl-dashboard-mobile-menu-logo" />
          </button>
          {userMenuOpen && (
            <div className="csl-dashboard-mobile-account-menu">
              <div className="csl-dashboard-mobile-menu-brand">
                <span>
                  <strong>CONSILIUM</strong>
                  <small>Design</small>
                </span>
                <ConsiliumPrismLogo size={24} className="csl-dashboard-mobile-menu-brand-logo" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  router.push("/dashboard/projects")
                }}
              >
                <Ico.folder size={15} color="currentColor" />
                Projets
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/profile") }}
              >
                <UserRound size={15} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/settings") }}
              >
                <Settings size={15} />
                Settings
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/billing") }}
              >
                <CreditCard size={15} />
                Billing
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => { setUserMenuOpen(false); void logout() }}
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* SIDEBAR */}
      <aside className="csl-sb">
        <div className="csl-sb-head">
          <div className="csl-sb-logo">
            <ConsiliumPrismLogo size={38} />
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div className="csl-sb-brand-row">
              <span>CONSILIUM</span>
            </div>
            <div className="csl-sb-brand-script">BY AMBITECH</div>
          </div>
        </div>

        <div className="csl-sb-form">
          <div className="csl-form-title">New project</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate() }}
            placeholder="Project name"
            className="csl-input"
            disabled={isCreating}
          />

          <div className="csl-form-label">Visual type</div>
          <button
            type="button"
            className="csl-form-picker"
            onClick={cycleSystem}
            title="Click to change type"
          >
            <span className="csl-form-picker-icon">
              <Ico.folder size={16} color="#EC4899" />
            </span>
            <span style={{ flex: 1 }}>
              <div className="csl-form-picker-label">{selectedSystem?.name ?? "Select..."}</div>
              <div className="csl-form-picker-sub">Click to change</div>
            </span>
          </button>

          <div className="csl-form-label">Poster shape</div>
          <button
            type="button"
            className="csl-form-picker"
            onClick={cycleShape}
            title="Click to change shape"
          >
            <span className="csl-form-picker-icon">
              <ShapeIcon slug={selectedShape.slug} />
            </span>
            <span style={{ flex: 1 }}>
              <div className="csl-form-picker-label">{selectedShape.name}</div>
              <div className="csl-form-picker-sub">{selectedShape.hint}</div>
            </span>
          </button>

          <div style={{ marginTop: 20 }}>
            <AssetImportPanel
              assets={pendingAssets}
              onChange={setPendingAssets}
              disabled={isCreating}
            />
          </div>

          <button
            type="button"
            className="csl-btn-primary"
            onClick={() => void handleCreate()}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              "Creating..."
            ) : (
              <>
                <Ico.plus />
                Create
              </>
            )}
          </button>

          {createError && (
            <div className="csl-error" style={{ marginTop: 12 }}>{createError}</div>
          )}
        </div>

        <div className="csl-sb-foot" ref={userMenuRef} style={{ position: "relative" }}>
          {userMenuOpen && (
            <div
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: "100%",
                marginBottom: 8,
                background: "var(--sb-bg-elev)",
                border: "1px solid var(--sb-border-2)",
                borderRadius: 12,
                boxShadow: "0 12px 32px rgba(0,0,0,0.55)",
                padding: 6,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/profile") }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "var(--sb-ink-0)", borderRadius: 6, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sb-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/settings") }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "var(--sb-ink-0)", borderRadius: 6, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sb-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/billing") }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "var(--sb-ink-0)", borderRadius: 6, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sb-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Billing
              </button>
              <div style={{ height: 1, background: "var(--sb-border)", margin: "4px 6px" }} />
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); void logout() }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#f87171", borderRadius: 6, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Sign out
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 12px",
              border: "1px solid var(--sb-border-2)",
              borderRadius: 12,
              background: userMenuOpen ? "var(--sb-bg-hover)" : "var(--sb-bg-elev)",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
              transition: "background .15s",
            }}
          >
            <span style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg, #8B5CF6, #EC4899 58%, #22D3EE)",
              color: "#fff",
              fontSize: 11.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>{initials}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--sb-ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.fullName ?? "Account"}
              </span>
              <span style={{ display: "block", fontSize: 11, color: "var(--sb-ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email ?? ""}
              </span>
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--sb-ink-2)", transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="csl-main">
        <div className="csl-topbar">
          <div className="csl-dashboard-section-title">
            <span>Projects</span>
          </div>
          <div className="csl-search">
            <span className="csl-search-icon"><Ico.search /></span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="csl-input"
            />
          </div>
        </div>
        <div className="csl-divider" />

        {error && <div className="csl-error">{error}</div>}

        <div className="csl-grid-wrap">
          {isLoading ? (
            <div className="csl-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="csl-card" style={{ opacity: .5 }}>
                  <div className="csl-card-thumb">
                    <Ico.folder size={42} />
                  </div>
                  <div className="csl-card-meta">
                    <div className="csl-card-title">…</div>
                    <div className="csl-card-sub">Loading...</div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="csl-empty">
              {search
                ? "No project matches your search."
                : "No projects yet. Create your first project from the left panel."}
            </div>
          ) : (
            <div className="csl-grid">
              {filteredProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  featured={i === 0 && !search}
                  onOpen={() => void openProject(p)}
                  onDelete={() => {
                    if (window.confirm(`Delete project "${p.title}"?`)) {
                      void removeProject(p.id)
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ProjectCard({
  project, featured, onOpen, onDelete,
}: {
  project: Project
  featured?: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const sub = project.updatedAt ? `Your design · ${timeAgo(project.updatedAt)}` : "Your design"

  return (
    <div className="csl-card" onClick={onOpen}>
      <div className={`csl-card-thumb ${featured ? "featured" : ""}`}>
        <div className="csl-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="csl-card-action"
            onClick={onDelete}
            title="Delete"
            aria-label="Delete"
          >
            <Ico.x />
          </button>
        </div>
        <Ico.folder size={featured ? 56 : 42} color={featured ? "#22D3EE" : "#8B5CF6"} />
      </div>
      <div className="csl-card-meta">
        <div className="csl-card-title">{project.title || "Untitled project"}</div>
        <div className="csl-card-row">
          <div className="csl-card-sub">{sub}</div>
          <span className="csl-card-chip">Owner</span>
        </div>
      </div>
    </div>
  )
}
