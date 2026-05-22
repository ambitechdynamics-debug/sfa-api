// Inline SVG icon set, lucide-style stroke 1.5 — preserved from the design bundle
import type { CSSProperties, SVGProps } from "react"

const ICONS: Record<string, React.ReactElement> = {
  flyer: (<><path d="M3 12L21 4l-4 18-4-8-7-2z" /><path d="M13 14l4-7" /></>),
  home: (<><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>),
  sparkles: (<><path d="M12 3v4M12 17v4M3 12h4M17 12h4" /><path d="M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" /></>),
  layers: (<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /><path d="M3 17l9 5 9-5" /></>),
  history: (<><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></>),
  folder: (<><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" /></>),
  folderPlus: (<><path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" /><path d="M12 10v6M9 13h6" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4.5 5-7 8-7s6.5 2.5 8 7" /></>),
  settings: (<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a7.97 7.97 0 0 0 0-6l2-1.2-2-3.4-2.3.7a8 8 0 0 0-5.2-3L11.5 0h-4l-.4 2.1a8 8 0 0 0-5.2 3L-.4 4.4l-2 3.4 2 1.2a7.97 7.97 0 0 0 0 6l-2 1.2 2 3.4 2.3-.7a8 8 0 0 0 5.2 3L7.5 24h4l.4-2.1a8 8 0 0 0 5.2-3l2.3.7 2-3.4-2-1.2z" transform="translate(2.4 0)" /></>),
  bell: (<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z" /><path d="M10 21a2 2 0 0 0 4 0" /></>),
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  plus: (<><path d="M12 5v14M5 12h14" /></>),
  check: (<><path d="M5 12l5 5L20 7" /></>),
  x: (<><path d="M6 6l12 12M18 6l-12 12" /></>),
  arrowR: (<><path d="M5 12h14M13 5l7 7-7 7" /></>),
  arrowL: (<><path d="M19 12H5M11 19l-7-7 7-7" /></>),
  chevronR: (<><path d="M9 6l6 6-6 6" /></>),
  chevronL: (<><path d="M15 6l-6 6 6 6" /></>),
  chevronD: (<><path d="M6 9l6 6 6-6" /></>),
  chevronDown: (<><path d="M6 9l6 6 6-6" /></>),
  chevronU: (<><path d="M6 15l6-6 6 6" /></>),
  download: (<><path d="M12 4v12M6 12l6 6 6-6" /><path d="M4 20h16" /></>),
  upload: (<><path d="M12 16V4M6 10l6-6 6 6" /><path d="M4 20h16" /></>),
  archive: (<><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" /><path d="M10 13h4" /></>),
  image: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></>),
  wand: (<><path d="M3 21l9-9" /><path d="M14 4l2 2M18 8l2 2M14 8l4-4M18 12l4-4" /></>),
  palette: (<><path d="M12 22a10 10 0 1 1 9-14c0 3-2 4-4 4h-2a2 2 0 0 0-2 2v2c0 2-1 4-3 4z" /><circle cx="7.5" cy="10" r="1" /><circle cx="11" cy="6.5" r="1" /><circle cx="16" cy="8" r="1" /></>),
  type: (<><path d="M4 7V5h16v2" /><path d="M9 5v14M15 5v14" /><path d="M7 19h10" /></>),
  layout: (<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>),
  layoutSidebar: (<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>),
  edit: (<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></>),
  trash: (<><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" /></>),
  copy: (<><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>),
  star: (<><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7L2 9.5l7.1-.6L12 2z" /></>),
  heart: (<><path d="M20.8 6.6a5.5 5.5 0 0 0-9.3-2.4l-.5.5-.5-.5a5.5 5.5 0 1 0-7.8 7.8l8.3 8.4 8.3-8.4a5.5 5.5 0 0 0 1.5-5.4z" /></>),
  zap: (<><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></>),
  credit: (<><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 11h20" /></>),
  crown: (<><path d="M3 18l2-10 5 5 2-7 2 7 5-5 2 10z" /><path d="M3 21h18" /></>),
  rocket: (<><path d="M5 13L3 21l8-2 8-8a4 4 0 0 0-6-6L5 13z" /><circle cx="14" cy="10" r="1" /><path d="M5 17l2 2" /></>),
  message: (<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>),
  help: (<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5" /><path d="M12 18h.01" /></>),
  lifebuoy: (<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><path d="M4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M19.1 4.9l-4.3 4.3M9.2 14.8l-4.3 4.3" /></>),
  info: (<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>),
  warn: (<><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v4M12 17h.01" /></>),
  eye: (<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  eyeOff: (<><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" /><path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.4 4.5M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c1.6 0 3-.3 4.3-.8" /></>),
  filter: (<><path d="M3 4h18l-7 9v7l-4-2v-5L3 4z" /></>),
  grid: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  list: (<><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>),
  refresh: (<><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></>),
  more: (<><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>),
  moreHorizontal: (<><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>),
  send: (<><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></>),
  bookmark: (<><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></>),
  globe: (<><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" /></>),
  calendar: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  tag: (<><path d="M20 12l-8 8-9-9V3h8z" /><circle cx="7.5" cy="7.5" r="1" /></>),
  share: (<><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 11l8-4M8 13l8 4" /></>),
  lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  logout: (<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>),
  bolt: (<><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" /></>),
  brush: (<><path d="M9.06 11.9l8.07-8.06a2 2 0 0 1 2.83 2.83l-8.06 8.07" /><path d="M7 13a4 4 0 0 0-4 4c0 1.5-1 2-2 2 1 1 2.5 2 4 2a4 4 0 0 0 4-4 4 4 0 0 0-2-2z" /></>),
  pencil: (<><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></>),
  pen: (<><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" /></>),
  expand: (<><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></>),
  trend: (<><path d="M22 7l-9 9-4-4-7 7" /><path d="M16 7h6v6" /></>),
  spinner: (<><path d="M21 12a9 9 0 1 1-6.2-8.6" /></>),
  clock: (<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>),
  arrowUpRight: (<><path d="M7 17L17 7M7 7h10v10" /></>),
}

export type IconName = keyof typeof ICONS

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name" | "stroke"> {
  name: IconName | string
  size?: number
  stroke?: number
  style?: CSSProperties
  className?: string
}

export function Icon({ name, size = 18, stroke = 1.5, style, className, ...rest }: IconProps) {
  const node = ICONS[name as IconName]
  if (!node) return null
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {node}
    </svg>
  )
}
