"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useProjectStore } from "@/store/project-store"
import { useCreationOptionsStore } from "@/store/creation-options-store"
import { createTravail, uploadProjectFile } from "@/lib/projects"
import { getProjectWorkspacePath } from "@/lib/project-navigation"
import type { Project } from "@/types/project"
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
 * Types de visuels par défaut — utilisés si le store CreationOption est vide
 * (ex : DB non seedée, API offline). Couvre les formats les plus courants
 * de Studio Flyer AI.
 */
const DEFAULT_VISUAL_TYPES = [
  { id: "default-flyer",        slug: "flyer",        name: "Flyer" },
  { id: "default-poster",       slug: "poster",       name: "Affiche" },
  { id: "default-social-post",  slug: "social_post",  name: "Post réseaux sociaux" },
  { id: "default-social-story", slug: "story",        name: "Story Instagram / Reel" },
  { id: "default-card",         slug: "business_card", name: "Carte de visite" },
  { id: "default-banner",       slug: "banner",       name: "Bannière web" },
  { id: "default-menu",         slug: "menu",         name: "Menu restaurant" },
] as const

/**
 * Formes (aspect ratios) d'affiche supportées. Le slug est passé tel quel à
 * `createTravail.format` et résolu côté backend par `ratioFromFormat`
 * (apps/SFA-API/src/modules/image-generation/imageGen.service.ts).
 */
const FORMAT_SHAPES = [
  { slug: "3:4",  name: "Portrait — 3:4",  hint: "Flyer · Affiche · A4" },
  { slug: "1:1",  name: "Carré — 1:1",     hint: "Instagram · Facebook" },
  { slug: "9:16", name: "Story — 9:16",    hint: "Story · Reels · TikTok" },
  { slug: "16:9", name: "Bannière — 16:9", hint: "YouTube · Bannière web" },
  { slug: "4:3",  name: "Paysage — 4:3",   hint: "Présentation · Pub" },
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
  folder: ({ size = 36, color = "#A89E8C" }: { size?: number; color?: string }) => (
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
        stroke="#E89376"
        strokeWidth="1.6"
        fill="rgba(232,147,118,0.18)"
      />
    </svg>
  )
}

function timeAgo(iso: string | undefined, lang: "fr" | "en" = "fr"): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return lang === "fr" ? "À l'instant" : "Just now"
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days === 1) return lang === "fr" ? "Hier" : "Yesterday"
  if (days < 7) return `${days} j`
  return new Date(iso).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" })
}

const TOP_TABS = ["Récent", "Vos créations", "Exemples", "Systèmes de conception"] as const

type TopTab = (typeof TOP_TABS)[number]

export function UserNewDashboard() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { projects, isLoading, error, loadProjects, removeProject } = useProjectStore()
  const addProject = useProjectStore((s) => s.addProject)
  const { options, fetchOptions } = useCreationOptionsStore()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const [pendingAssets, setPendingAssets] = useState<PendingAsset[]>([])

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return
    const onDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    window.addEventListener("mousedown", onDown)
    return () => window.removeEventListener("mousedown", onDown)
  }, [userMenuOpen])

  const [topTab, setTopTab] = useState<TopTab>("Récent")
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

  // Defensive : les stores peuvent renvoyer undefined transitoirement (boot, réponse API malformée).
  const safeOptions = Array.isArray(options) ? options : []
  const safeProjects = Array.isArray(projects) ? projects : []

  // Fallback : si le backend ne renvoie aucun type, on utilise la liste par défaut
  // pour que l'utilisateur puisse quand même créer un projet sans rester bloqué.
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
      setCreateError(err instanceof Error ? err.message : "Création impossible. Réessayez.")
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
      {/* SIDEBAR */}
      <aside className="csl-sb">
        <div className="csl-sb-head">
          <div className="csl-sb-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Studio Flyer AI" />
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <div className="csl-sb-brand-row">
              <span>Consilium</span>
            </div>
            <div className="csl-sb-brand-script">Design</div>
          </div>
        </div>

        <div className="csl-sb-form">
          <div className="csl-form-title">Nouveau projet</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreate() }}
            placeholder="Nom du projet"
            className="csl-input"
            disabled={isCreating}
          />

          <div className="csl-form-label">Type de visuel</div>
          <button
            type="button"
            className="csl-form-picker"
            onClick={cycleSystem}
            title="Cliquez pour changer de type"
          >
            <span className="csl-form-picker-icon">
              <Ico.folder size={16} color="#E89376" />
            </span>
            <span style={{ flex: 1 }}>
              <div className="csl-form-picker-label">{selectedSystem?.name ?? "Sélectionner…"}</div>
              <div className="csl-form-picker-sub">Cliquer pour changer</div>
            </span>
          </button>

          <div className="csl-form-label">Forme de l&apos;affiche</div>
          <button
            type="button"
            className="csl-form-picker"
            onClick={cycleShape}
            title="Cliquez pour changer de forme"
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
              "Création…"
            ) : (
              <>
                <Ico.plus />
                Créer
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
                Profil
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/settings") }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "var(--sb-ink-0)", borderRadius: 6, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sb-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Paramètres
              </button>
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); router.push("/dashboard/billing") }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "var(--sb-ink-0)", borderRadius: 6, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sb-bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Facturation
              </button>
              <div style={{ height: 1, background: "var(--sb-border)", margin: "4px 6px" }} />
              <button
                type="button"
                onClick={() => { setUserMenuOpen(false); void logout() }}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "inherit", color: "#f87171", borderRadius: 6, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(248,113,113,0.12)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Se déconnecter
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
              background: "linear-gradient(135deg, #E89376, #c66a45)",
              color: "#fff",
              fontSize: 11.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>{initials}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--sb-ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.fullName ?? "Compte"}
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
          <nav className="csl-toptabs">
            {TOP_TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTopTab(t)}
                className={`csl-toptab ${topTab === t ? "active" : ""}`}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="csl-search">
            <span className="csl-search-icon"><Ico.search /></span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Chercher…"
              className="csl-input"
              style={{ paddingLeft: 32 }}
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
                    <div className="csl-card-sub">Chargement…</div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="csl-empty">
              {search
                ? "Aucun projet ne correspond à votre recherche."
                : "Aucun projet pour l'instant. Créez votre premier projet dans le panneau de gauche."}
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
                    if (window.confirm(`Supprimer le projet "${p.title}" ?`)) {
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
  const sub = project.updatedAt ? `Votre design · ${timeAgo(project.updatedAt)}` : "Votre design"

  return (
    <div className="csl-card" onClick={onOpen}>
      <div className={`csl-card-thumb ${featured ? "featured" : ""}`}>
        <div className="csl-card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="csl-card-action"
            onClick={onDelete}
            title="Supprimer"
            aria-label="Supprimer"
          >
            <Ico.x />
          </button>
        </div>
        <Ico.folder size={featured ? 56 : 42} color={featured ? "#8B9DBA" : "#A89E8C"} />
      </div>
      <div className="csl-card-meta">
        <div className="csl-card-title">{project.title || "Projet sans titre"}</div>
        <div className="csl-card-row">
          <div className="csl-card-sub">{sub}</div>
          <span className="csl-card-chip">Propriétaire</span>
        </div>
      </div>
    </div>
  )
}
