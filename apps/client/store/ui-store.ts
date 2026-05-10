"use client"

import { create } from "zustand"

export const ACCENT_PALETTES: Record<string, { acc: string; bright: string; deep: string; soft: string; line: string }> = {
  "#e08a64": { acc: "#e08a64", bright: "#ea9b75", deep: "#c66a45", soft: "rgba(224,138,100,0.14)", line: "rgba(224,138,100,0.32)" },
  "#8aa57a": { acc: "#8aa57a", bright: "#9bb88a", deep: "#6d8a5e", soft: "rgba(138,165,122,0.14)", line: "rgba(138,165,122,0.32)" },
  "#b08bc7": { acc: "#b08bc7", bright: "#c2a3d4", deep: "#8e6ba8", soft: "rgba(176,139,199,0.14)", line: "rgba(176,139,199,0.32)" },
  "#d8a85a": { acc: "#d8a85a", bright: "#e3b96d", deep: "#b88a3e", soft: "rgba(216,168,90,0.14)", line: "rgba(216,168,90,0.32)" },
  "#7aa3c9": { acc: "#7aa3c9", bright: "#8db5d8", deep: "#5d86ab", soft: "rgba(122,163,201,0.14)", line: "rgba(122,163,201,0.32)" },
}

type Theme = "dark" | "light"
type Density = "compact" | "regular" | "comfy"

interface UiState {
  theme: Theme
  density: Density
  accent: string
  setTheme: (t: Theme) => void
  setDensity: (d: Density) => void
  setAccent: (a: string) => void
  hydrateUi: () => void
}

const isBrowser = () => typeof window !== "undefined"

function applyTokens(theme: Theme, density: Density, accent: string) {
  if (!isBrowser()) return
  const root = document.documentElement
  root.setAttribute("data-theme", theme)
  root.setAttribute("data-density", density)
  const p = ACCENT_PALETTES[accent] ?? ACCENT_PALETTES["#e08a64"]
  root.style.setProperty("--acc", p.acc)
  root.style.setProperty("--acc-bright", p.bright)
  root.style.setProperty("--acc-deep", p.deep)
  root.style.setProperty("--acc-soft", p.soft)
  root.style.setProperty("--acc-line", p.line)
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: "dark",
  density: "regular",
  accent: "#e08a64",
  setTheme: (theme) => {
    if (isBrowser()) localStorage.setItem("ui_theme", theme)
    applyTokens(theme, get().density, get().accent)
    set({ theme })
  },
  setDensity: (density) => {
    if (isBrowser()) localStorage.setItem("ui_density", density)
    applyTokens(get().theme, density, get().accent)
    set({ density })
  },
  setAccent: (accent) => {
    if (isBrowser()) localStorage.setItem("ui_accent", accent)
    applyTokens(get().theme, get().density, accent)
    set({ accent })
  },
  hydrateUi: () => {
    if (!isBrowser()) return
    const theme = (localStorage.getItem("ui_theme") as Theme) || "dark"
    const density = (localStorage.getItem("ui_density") as Density) || "regular"
    const accent = localStorage.getItem("ui_accent") || "#e08a64"
    applyTokens(theme, density, accent)
    set({ theme, density, accent })
  },
}))
