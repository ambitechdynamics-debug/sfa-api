"use client"

import { useEffect, useRef, useState } from "react"
import { deleteProjectFile, fetchProjectFiles, updateProjectFile, uploadProjectFile } from "@/lib/projects"
import type { FileAsset } from "@/types/project"

type AssetType = "logo" | "product" | "reference" | "poster" | "character" | "other"

interface WorkspaceAssetPanelProps {
  projectId?: string | null
  refreshKey?: number
}

interface UploadingAsset {
  id: string
  name: string
  type: AssetType
  previewUrl: string
  status: "uploading" | "error"
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

const USAGE_TO_ASSET_TYPE: Record<string, AssetType> = {
  LOGO: "logo",
  PRODUCT_IMAGE: "product",
  REFERENCE_IMAGE: "reference",
  GENERATED_POSTER: "poster",
  PERSON_IMAGE: "character",
  OTHER: "other",
}

const ASSET_TYPE_TO_USAGE: Record<AssetType, string> = {
  logo: "LOGO",
  product: "PRODUCT_IMAGE",
  reference: "REFERENCE_IMAGE",
  poster: "GENERATED_POSTER",
  character: "PERSON_IMAGE",
  other: "OTHER",
}

const MAX_FILE_SIZE_MB = 10
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "svg"]

function isImageAsset(asset: FileAsset) {
  if (asset.fileType.startsWith("image/")) return true
  const format = asset.format?.toLowerCase()
  return Boolean(format && ALLOWED_EXT.includes(format))
}

function assetTypeFromUsage(usageType: string): AssetType {
  return USAGE_TO_ASSET_TYPE[usageType] ?? "other"
}

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function WorkspaceAssetPanel({ projectId, refreshKey = 0 }: WorkspaceAssetPanelProps) {
  const [assets, setAssets] = useState<FileAsset[]>([])
  const [uploadingAssets, setUploadingAssets] = useState<UploadingAsset[]>([])
  const uploadingAssetsRef = useRef<UploadingAsset[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [primaryId, setPrimaryId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pendingTypeRef = useRef<AssetType>("reference")

  useEffect(() => {
    if (!projectId) {
      setAssets([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void fetchProjectFiles(projectId)
      .then((files) => {
        if (cancelled) return
        setAssets(files)
        setPrimaryId((current) => (
          current && files.some((file) => file.id === current)
            ? current
            : files.find((file) => file.usageType === "LOGO")?.id ?? files[0]?.id ?? null
        ))
      })
      .catch((err) => {
        console.error("[workspace assets] fetch failed", err)
        if (!cancelled) setError("Impossible de charger les fichiers du projet.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [projectId, refreshKey])

  useEffect(() => {
    uploadingAssetsRef.current = uploadingAssets
  }, [uploadingAssets])

  useEffect(() => {
    return () => {
      uploadingAssetsRef.current.forEach((asset) => URL.revokeObjectURL(asset.previewUrl))
    }
  }, [])

  function openPicker(type: AssetType) {
    if (!projectId) return
    pendingTypeRef.current = type
    fileInputRef.current?.click()
  }

  async function processFiles(files: File[], type: AssetType) {
    if (!projectId || files.length === 0) return
    setError(null)

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" dépasse ${MAX_FILE_SIZE_MB} Mo.`)
        continue
      }

      const ext = file.name.split(".").pop()?.toLowerCase()
      if (!ext || !ALLOWED_EXT.includes(ext)) {
        setError(`"${file.name}" n'est pas un format image accepté.`)
        continue
      }

      const tempId = `wa-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const previewUrl = URL.createObjectURL(file)
      setUploadingAssets((current) => [
        { id: tempId, name: file.name, type, previewUrl, status: "uploading" },
        ...current,
      ])

      try {
        const uploaded = await uploadProjectFile(projectId, file, ASSET_TYPE_TO_USAGE[type] ?? "OTHER")
        setAssets((current) => [uploaded, ...current])
        setPrimaryId((current) => current ?? uploaded.id)
        setUploadingAssets((current) => {
          const target = current.find((asset) => asset.id === tempId)
          if (target) URL.revokeObjectURL(target.previewUrl)
          return current.filter((asset) => asset.id !== tempId)
        })
      } catch (err) {
        console.error("[workspace assets] upload failed", err)
        setUploadingAssets((current) => current.map((asset) => (
          asset.id === tempId ? { ...asset, status: "error" } : asset
        )))
        setError(err instanceof Error ? err.message : "Import impossible.")
      }
    }
  }

  async function removePersistedAsset(id: string) {
    const previous = assets
    const previousPrimaryId = primaryId
    const remaining = previous.filter((asset) => asset.id !== id)
    setAssets((current) => current.filter((asset) => asset.id !== id))
    if (primaryId === id) {
      setPrimaryId(remaining.find((asset) => asset.usageType === "LOGO")?.id ?? remaining[0]?.id ?? null)
    }

    try {
      await deleteProjectFile(id)
    } catch (err) {
      console.error("[workspace assets] delete failed", err)
      setAssets(previous)
      setPrimaryId(previousPrimaryId)
      setError(err instanceof Error ? err.message : "Suppression impossible.")
    }
  }

  async function cycleType(id: string) {
    const target = assets.find((asset) => asset.id === id)
    if (!target) return

    const currentType = assetTypeFromUsage(target.usageType)
    const nextType = ASSET_TYPES[(ASSET_TYPES.indexOf(currentType) + 1) % ASSET_TYPES.length]
    const nextUsageType = ASSET_TYPE_TO_USAGE[nextType] ?? "OTHER"
    const previous = assets
    setError(null)
    setAssets((current) => current.map((asset) => (
      asset.id === id ? { ...asset, usageType: nextUsageType } : asset
    )))

    try {
      const updated = await updateProjectFile(id, { usageType: nextUsageType })
      setAssets((current) => current.map((asset) => (asset.id === id ? updated : asset)))
    } catch (err) {
      console.error("[workspace assets] update usage failed", err)
      setAssets(previous)
      setError(err instanceof Error ? err.message : "Changement de type impossible.")
    }
  }

  function removeUploadingAsset(id: string) {
    setUploadingAssets((current) => {
      const target = current.find((asset) => asset.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((asset) => asset.id !== id)
    })
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      void processFiles(Array.from(files), pendingTypeRef.current)
    }
    e.target.value = ""
  }

  const allCount = assets.length + uploadingAssets.length
  const disabled = !projectId
  const isEmpty = allCount === 0

  return (
    <div className="csl-ws-assets">
      <div style={{ fontSize: 12.5, color: "var(--csl-ink-1)", marginBottom: 8 }}>
        Fichiers de conception
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (disabled) return
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            void processFiles(Array.from(e.dataTransfer.files), "reference")
          }
        }}
        style={{
          display: "grid",
          gridTemplateColumns: isEmpty ? "112px" : "repeat(auto-fill, minmax(112px, 1fr))",
          gap: 10,
          padding: 8,
          border: `1.5px dashed ${dragOver ? "var(--csl-accent)" : "var(--csl-border-2)"}`,
          borderRadius: 12,
          background: dragOver ? "rgba(232,147,118,0.08)" : "transparent",
          transition: "background .15s, border-color .15s",
          minHeight: isEmpty ? 150 : undefined,
          alignContent: isEmpty ? "center" : "start",
          justifyContent: isEmpty ? "center" : undefined,
          maxHeight: 280,
          overflowY: "auto",
        }}
      >
        {uploadingAssets.map((asset) => (
          <div
            key={asset.id}
            style={{
              borderRadius: 8,
              overflow: "hidden",
              border: asset.status === "error" ? "1px solid rgba(248,113,113,0.55)" : "1px solid var(--csl-border-2)",
              background: "var(--csl-bg)",
              display: "flex",
              flexDirection: "column",
              opacity: asset.status === "uploading" ? 0.72 : 1,
            }}
          >
            <div style={{ aspectRatio: "1", overflow: "hidden", position: "relative", background: "var(--csl-bg-mute)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.previewUrl}
                alt={asset.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderTop: "1px solid var(--csl-border-2)",
                background: "var(--csl-bg)",
                height: 30,
              }}
            >
              <span
                title={asset.status === "uploading" ? "Import en cours" : "Import échoué"}
                style={{
                  borderRight: "1px solid var(--csl-border-2)",
                  color: asset.status === "uploading" ? "var(--csl-accent)" : "#f87171",
                  width: 30,
                  height: "100%",
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                }}
              >
                {asset.status === "uploading" ? "…" : "!"}
              </span>
              <span
                title={asset.name}
                style={{
                  color: "var(--csl-ink-2)",
                  fontSize: 10.5,
                  fontWeight: 600,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  padding: "0 6px",
                  textTransform: "uppercase",
                }}
              >
                {ASSET_LABELS[asset.type]}
              </span>
              <button
                type="button"
                onClick={() => removeUploadingAsset(asset.id)}
                aria-label="Retirer"
                style={{
                  border: 0,
                  borderLeft: "1px solid var(--csl-border-2)",
                  background: "transparent",
                  color: "var(--csl-ink-2)",
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
                <XIcon />
              </button>
            </div>
          </div>
        ))}

        {assets.map((asset) => {
          const type = assetTypeFromUsage(asset.usageType)
          const isPrimary = primaryId === asset.id

          return (
            <div
              key={asset.id}
              style={{
                borderRadius: 8,
                overflow: "hidden",
                border: `1px solid ${isPrimary ? "var(--csl-accent)" : "var(--csl-border-2)"}`,
                background: "var(--csl-bg)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <a
                href={asset.fileUrl}
                target="_blank"
                rel="noreferrer"
                title={asset.originalName}
                style={{
                  aspectRatio: "1",
                  overflow: "hidden",
                  position: "relative",
                  background: "var(--csl-bg-mute)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--csl-ink-2)",
                }}
              >
                {isImageAsset(asset) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.fileUrl}
                    alt={asset.originalName}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <FileIcon />
                )}
              </a>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderTop: `1px solid ${isPrimary ? "rgba(232,147,118,0.30)" : "var(--csl-border-2)"}`,
                  background: isPrimary ? "rgba(232,147,118,0.10)" : "var(--csl-bg)",
                  height: 30,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPrimaryId(asset.id)}
                  title={isPrimary ? "Élément principal" : "Définir comme principal"}
                  style={{
                    border: 0,
                    borderRight: `1px solid ${isPrimary ? "rgba(232,147,118,0.30)" : "var(--csl-border-2)"}`,
                    background: "transparent",
                    color: isPrimary ? "var(--csl-accent)" : "var(--csl-ink-3)",
                    width: 30,
                    height: "100%",
                    flexShrink: 0,
                    cursor: "pointer",
                    fontSize: 14,
                    fontFamily: "inherit",
                  }}
                >
                  {isPrimary ? "★" : "☆"}
                </button>
                <button
                  type="button"
                  onClick={() => void cycleType(asset.id)}
                  title="Changer le type"
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "var(--csl-ink-2)",
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
                  {ASSET_LABELS[type]}
                </button>
                <button
                  type="button"
                  onClick={() => void removePersistedAsset(asset.id)}
                  aria-label="Supprimer"
                  style={{
                    border: 0,
                    borderLeft: "1px solid var(--csl-border-2)",
                    background: "transparent",
                    color: "var(--csl-ink-2)",
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
                  <XIcon />
                </button>
              </div>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => openPicker("reference")}
          disabled={disabled}
          style={{
            position: "relative",
            borderRadius: 8,
            border: "1.5px dashed var(--csl-border-3)",
            background: "transparent",
            aspectRatio: "1",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
            fontFamily: "inherit",
            color: "var(--csl-ink-2)",
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "rgba(255,255,255,0.04)" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <UploadIcon />
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

      {loading && (
        <div style={{ fontSize: 11, color: "var(--csl-ink-2)", marginTop: 6 }}>
          Chargement des fichiers...
        </div>
      )}
      {!loading && !error && isEmpty && (
        <div style={{ fontSize: 11, color: "var(--csl-ink-2)", marginTop: 6 }}>
          Aucun fichier pour l'instant. Importez logo, produit ou référence.
        </div>
      )}
      {allCount > 0 && (
        <div style={{ fontSize: 11, color: "var(--csl-ink-2)", marginTop: 6 }}>
          {allCount} fichier{allCount > 1 ? "s" : ""} disponible{allCount > 1 ? "s" : ""}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 6 }}>
          {error}
        </div>
      )}
    </div>
  )
}
