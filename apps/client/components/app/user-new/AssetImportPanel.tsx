"use client"

import { useEffect, useRef, useState } from "react"

export type AssetType = "logo" | "product" | "reference" | "poster" | "character" | "other"

export interface PendingAsset {
  id: string
  file: File
  name: string
  type: AssetType
  previewUrl: string
  isPrimary?: boolean
}

const ASSET_LABELS: Record<AssetType, string> = {
  logo: "Logo",
  product: "Produit",
  reference: "Inspiration",
  poster: "Affiche",
  character: "Personnage",
  other: "Autre",
}

const ASSET_TYPES: AssetType[] = ["logo", "product", "reference", "poster", "character", "other"]

const MAX_FILE_SIZE_MB = 10
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "svg"]

interface Props {
  assets: PendingAsset[]
  onChange: (next: PendingAsset[]) => void
  disabled?: boolean
}

/**
 * AssetImportPanel — petite zone d'import d'éléments importants (logo, produit,
 * inspiration, etc.) à intégrer dans la sidebar du Dashboard. Les fichiers
 * sont conservés en mémoire (objets File + objectURL pour les thumbnails) ;
 * le parent les uploade sur le serveur au moment de la création du projet.
 */
export function AssetImportPanel({ assets, onChange, disabled = false }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingTypeRef = useRef<AssetType>("reference")

  // Cleanup objectURLs when assets change or component unmounts
  useEffect(() => {
    return () => {
      assets.forEach((a) => {
        if (a.previewUrl.startsWith("blob:")) URL.revokeObjectURL(a.previewUrl)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function processFiles(files: File[], type: AssetType) {
    if (files.length === 0) return
    const next: PendingAsset[] = []
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) continue
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXT.includes(ext)) continue
      next.push({
        id: `pa-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        name: file.name,
        type,
        previewUrl: URL.createObjectURL(file),
      })
    }
    if (next.length > 0) onChange([...assets, ...next])
  }

  function remove(id: string) {
    const target = assets.find((a) => a.id === id)
    if (target?.previewUrl.startsWith("blob:")) URL.revokeObjectURL(target.previewUrl)
    onChange(assets.filter((a) => a.id !== id))
  }

  function setPrimary(id: string) {
    onChange(assets.map((a) => ({ ...a, isPrimary: a.id === id })))
  }

  function cycleType(id: string) {
    onChange(assets.map((a) => {
      if (a.id !== id) return a
      const idx = ASSET_TYPES.indexOf(a.type)
      return { ...a, type: ASSET_TYPES[(idx + 1) % ASSET_TYPES.length] }
    }))
  }

  function openPicker(type: AssetType) {
    if (disabled) return
    pendingTypeRef.current = type
    fileInputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(Array.from(files), pendingTypeRef.current)
    }
    e.target.value = ""
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "var(--sb-ink-1, var(--csl-ink-1))", marginBottom: 8 }}>
        Éléments importants
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (disabled) return
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(Array.from(e.dataTransfer.files), "reference")
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          padding: 8,
          border: `1.5px dashed ${dragOver ? "var(--csl-accent)" : "var(--sb-border-2, var(--csl-border-2))"}`,
          borderRadius: 12,
          background: dragOver ? "rgba(232,147,118,0.08)" : "transparent",
          transition: "background .15s, border-color .15s",
          /* Cap the frame so many uploads scroll INSIDE instead of pushing
             the rest of the sidebar (form, créer button, user menu). */
          maxHeight: 280,
          overflowY: "auto",
        }}
      >
        {assets.map((a) => (
          <div
            key={a.id}
            style={{
              borderRadius: 8,
              overflow: "hidden",
              border: `1px solid ${a.isPrimary ? "var(--csl-accent)" : "var(--sb-border-2, var(--csl-border-2))"}`,
              background: "var(--sb-bg-elev, var(--csl-bg))",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative", background: "var(--sb-bg-hover, var(--csl-bg-mute))" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.previewUrl}
                alt={a.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderTop: `1px solid ${a.isPrimary ? "rgba(232,147,118,0.30)" : "var(--sb-border-2, var(--csl-border-2))"}`,
                background: a.isPrimary ? "rgba(232,147,118,0.10)" : "var(--sb-bg-elev, var(--csl-bg))",
                height: 30,
              }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPrimary(a.id) }}
                title={a.isPrimary ? "Élément principal" : "Définir comme principal"}
                style={{
                  border: 0,
                  borderRight: `1px solid ${a.isPrimary ? "rgba(232,147,118,0.30)" : "var(--sb-border-2, var(--csl-border-2))"}`,
                  background: "transparent",
                  color: a.isPrimary ? "var(--csl-accent)" : "var(--sb-ink-3, var(--csl-ink-3))",
                  width: 30,
                  height: "100%",
                  flexShrink: 0,
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              >
                {a.isPrimary ? "★" : "☆"}
              </button>
              <button
                type="button"
                onClick={() => cycleType(a.id)}
                title="Changer le type"
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--sb-ink-2, var(--csl-ink-2))",
                  fontSize: 10.5,
                  fontWeight: 600,
                  flex: 1,
                  height: "100%",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 6px",
                  fontFamily: "inherit",
                }}
              >
                {ASSET_LABELS[a.type]}
              </button>
              <button
                type="button"
                onClick={() => remove(a.id)}
                aria-label="Supprimer"
                style={{
                  border: 0,
                  borderLeft: "1px solid var(--sb-border-2, var(--csl-border-2))",
                  background: "transparent",
                  color: "var(--sb-ink-2, var(--csl-ink-2))",
                  width: 30,
                  height: "100%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {/* "+" add card */}
        <button
          type="button"
          onClick={() => openPicker("reference")}
          disabled={disabled}
          style={{
            position: "relative",
            borderRadius: 8,
            border: "1.5px dashed var(--sb-border-3, var(--csl-border-3))",
            background: "transparent",
            aspectRatio: "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            fontFamily: "inherit",
            color: "var(--sb-ink-2, var(--csl-ink-2))",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
          <span style={{ fontSize: 9, marginTop: 4, lineHeight: 1.2, textAlign: "center", padding: "0 4px" }}>
            Importer
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      {assets.length > 0 && (
        <div style={{ fontSize: 11, color: "var(--sb-ink-2, var(--csl-ink-2))", marginTop: 6 }}>
          {assets.length} fichier{assets.length > 1 ? "s" : ""} prêt{assets.length > 1 ? "s" : ""} à attacher
        </div>
      )}
    </div>
  )
}
