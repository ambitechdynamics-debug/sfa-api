"use client"

import type { ReactElement, SVGProps } from "react"

/* Fluent-style icons (1.5px stroke, square, 24×24 viewBox). */

export type IconName =
  | "back" | "search" | "home" | "grid" | "templates" | "brush" | "image"
  | "type" | "sparkle" | "bolt" | "layers" | "cloud" | "shield" | "user"
  | "building" | "star" | "check" | "arrow" | "globe" | "mail" | "bell"
  | "wifi" | "speaker" | "battery" | "share" | "download" | "plus"
  | "windows" | "filter" | "chev" | "copy" | "info" | "smile" | "rocket"

type IconProps = SVGProps<SVGSVGElement>

export const Ico: Record<IconName, (p?: IconProps) => ReactElement> = {
  back: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14.5 6 9 12l5.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="m15 15 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  home: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  grid: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  templates: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="4" y="4" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="11" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="16" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  brush: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14 4 4 14l3 3 6.5-3.5 4-4L14 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m17.5 9.5 2.5-2.5-3-3-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 17c-.7 1.3-2 2-3 2 .5-.5 1-1.5 1-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  image: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4 17 4-4 5 4 3-3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  type: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 6V5h14v1M12 5v15M8.5 20h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  sparkle: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  bolt: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  layers: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  cloud: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M7 19a4 4 0 0 1-.7-7.94 5 5 0 0 1 9.74-1.06A4 4 0 0 1 17 19H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3 5 5v6c0 4.5 3 8 7 10 4-2 7-5.5 7-10V5l-7-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 20c.5-3.5 3.5-5.5 7-5.5s6.5 2 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  building: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 11h4a1 1 0 0 1 1 1v9M8 8h3M8 12h3M8 16h3M17 14h0M17 17h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  globe: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.5 4 5.5 4 8.5s-1.5 6-4 8.5c-2.5-2.5-4-5.5-4-8.5s1.5-6 4-8.5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  mail: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2H4.5L6 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  wifi: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M2 9c5.5-5 14.5-5 20 0M5.5 12.5c3.5-3 9.5-3 13 0M9 16c1.5-1.5 4.5-1.5 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="19" r="1.2" fill="currentColor" />
    </svg>
  ),
  speaker: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a4 4 0 0 1 0 6M17.5 6.5a7 7 0 0 1 0 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  battery: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="8" width="16" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 11v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5" y="10" width="9" height="4" rx=".5" fill="currentColor" />
    </svg>
  ),
  share: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 4v12M7 9l5-5 5 5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  windows: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 5.5 11 4.3v7.2H3V5.5ZM13 4 21 2.8v8.7h-8V4ZM3 12.5h8v7.2L3 18.5v-6ZM13 12.5h8V21.2L13 20V12.5Z" fill="currentColor" />
    </svg>
  ),
  filter: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  chev: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  copy: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="9" y="4" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 17v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  info: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 11v6M12 8.2v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  smile: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 15c.8.8 1.9 1.3 3 1.3s2.2-.5 3-1.3M9.5 10v.5M14.5 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  rocket: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14.5 4.5a9 9 0 0 1 5 5L13 16l-4-4 5.5-7.5ZM7 13l-3 7 7-3M9 17l-2 2M16 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

/* Brand mark — small "C" tile */
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: "linear-gradient(135deg, #4cc2ff 0%, #2d6e8c 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(76,194,255,.35), inset 0 1px 0 rgba(255,255,255,.25)",
        flex: "none",
      }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none">
        <path d="M17 7.5A6.5 6.5 0 1 0 17 16.5" stroke="#0a1a23" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="17" cy="12" r="1.4" fill="#0a1a23" />
      </svg>
    </div>
  )
}
