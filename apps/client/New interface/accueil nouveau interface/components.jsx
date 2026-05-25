// components.jsx — shared UI primitives
// Window chrome, Fluent icons, taskbar buttons, and small helpers.
// All components attached to `window` at the bottom for cross-script use.

/* ============================================================
   FLUENT-STYLE ICONS (1.5px stroke, square, 24×24 viewBox)
   Drawn to mirror Win11 "Fluent Icons" feel — geometric, light.
   ============================================================ */
const Ico = {
  back: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14.5 6 9 12l5.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m15 15 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  home: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  grid: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="4" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="4" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="4" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="13" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  templates: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="4" y="4" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="4" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="13" y="11" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="4" y="16" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  brush: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14 4 4 14l3 3 6.5-3.5 4-4L14 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="m17.5 9.5 2.5-2.5-3-3-2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7 17c-.7 1.3-2 2-3 2 .5-.5 1-1.5 1-3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  image: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="9" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m4 17 4-4 5 4 3-3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  type: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 6V5h14v1M12 5v15M8.5 20h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sparkle: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  bolt: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  layers: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  cloud: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M7 19a4 4 0 0 1-.7-7.94 5 5 0 0 1 9.74-1.06A4 4 0 0 1 17 19H7Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  shield: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3 5 5v6c0 4.5 3 8 7 10 4-2 7-5.5 7-10V5l-7-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  user: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 20c.5-3.5 3.5-5.5 7-5.5s6.5 2 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  building: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 11h4a1 1 0 0 1 1 1v9M8 8h3M8 12h3M8 16h3M17 14h0M17 17h0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  star: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8 6.6 19.6l1.2-6L3.3 9.4l6.1-.8L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrow: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  globe: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3.5 12h17M12 3.5c2.5 2.5 4 5.5 4 8.5s-1.5 6-4 8.5c-2.5-2.5-4-5.5-4-8.5s1.5-6 4-8.5Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  mail: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  bell: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2H4.5L6 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 21a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  wifi: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M2 9c5.5-5 14.5-5 20 0M5.5 12.5c3.5-3 9.5-3 13 0M9 16c1.5-1.5 4.5-1.5 6 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="19" r="1.2" fill="currentColor"/>
    </svg>
  ),
  speaker: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M11 5 6 9H3v6h3l5 4V5ZM15 9a4 4 0 0 1 0 6M17.5 6.5a7 7 0 0 1 0 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  battery: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="3" y="8" width="16" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M20 11v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="5" y="10" width="9" height="4" rx=".5" fill="currentColor"/>
    </svg>
  ),
  share: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 4v12M7 9l5-5 5 5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  download: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 4v12M7 11l5 5 5-5M5 20h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  windows: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 5.5 11 4.3v7.2H3V5.5ZM13 4 21 2.8v8.7h-8V4ZM3 12.5h8v7.2L3 18.5v-6ZM13 12.5h8V21.2L13 20V12.5Z" fill="currentColor"/>
    </svg>
  ),
  filter: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M3 5h18M6 12h12M10 19h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  chev: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  copy: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <rect x="9" y="4" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 17v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  info: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M12 11v6M12 8.2v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  smile: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 15c.8.8 1.9 1.3 3 1.3s2.2-.5 3-1.3M9.5 10v.5M14.5 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  rocket: (p) => (
    <svg viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M14.5 4.5a9 9 0 0 1 5 5L13 16l-4-4 5.5-7.5ZM7 13l-3 7 7-3M9 17l-2 2M16 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

/* ============================================================
   WINDOW CHROME
   Renders a Win11-style window with traffic lights on the right.
   ============================================================ */
function WindowChrome({
  title,
  icon,
  children,
  className = "",
  style,
  glass = false,
  bordered = true,
  actions,
  scaleOnHover = false,
}) {
  return (
    <div
      className={`win ${className} ${scaleOnHover ? "win-hover" : ""}`}
      style={style}
    >
      <div className={`win-titlebar ${glass ? "glass" : ""}`}>
        <div className="win-title">
          {icon}
          <span>{title}</span>
        </div>
        {actions}
      </div>
      <div className="win-body">{children}</div>
    </div>
  );
}

/* Mini badge / kbd */
function Kbd({ children }) {
  return (
    <kbd style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      minWidth: 22, height: 22, padding: "0 6px",
      borderRadius: 4,
      background: "var(--bg-elev-1)",
      border: "1px solid var(--bd-medium)",
      borderBottomWidth: 2,
      fontFamily: "var(--font-mono)", fontSize: 11,
      color: "var(--tx-secondary)"
    }}>{children}</kbd>
  );
}

/* Stat tile mirroring Win11 settings cards */
function StatTile({ icon, label, value, sub }) {
  return (
    <div className="stat-tile">
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--tx-tertiary)", fontSize: 12, marginBottom: 12 }}>
        {icon}
        <span>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.15, color: "var(--tx-primary)" }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 18, fontSize: 12, color: "var(--tx-tertiary)" }}>{sub}</div>
      )}
    </div>
  );
}

/* Section "Informations" header inside a window (icon + title + chevron) */
function SectionRow({ icon, title, expanded = true, action }) {
  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "14px 18px",
      borderBottom: expanded ? "1px solid var(--bd-divider)" : "none"
    }}>
      <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", background: "var(--accent-soft)", borderRadius: 6, marginRight: 14 }}>
        {icon}
      </div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{title}</div>
      {action}
      <button className="btn" style={{ width: 32, height: 32, padding: 0, marginLeft: 8 }}>
        <Ico.chev style={{ width: 12, height: 12, transform: expanded ? "rotate(90deg)" : "none" }} />
      </button>
    </div>
  );
}

/* System tray cluster */
function SystemTray() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--tx-secondary)", padding: "0 10px" }}>
      <Ico.wifi style={{ width: 16, height: 16 }} />
      <Ico.speaker style={{ width: 16, height: 16 }} />
      <Ico.battery style={{ width: 18, height: 18 }} />
      <span style={{ fontSize: 12, marginLeft: 4, lineHeight: 1.1, textAlign: "right" }}>
        <div>18:34</div>
        <div style={{ color: "var(--tx-tertiary)" }}>16/05/2026</div>
      </span>
    </div>
  );
}

/* Avatar circle with initials */
function Avatar({ initials = "EB", size = 36, color = "linear-gradient(135deg,#4cc2ff,#2d6e8c)" }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color, display: "inline-flex",
      alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 600, color: "#0a1a23",
      flex: "none", border: "1px solid rgba(255,255,255,.08)"
    }}>
      {initials}
    </div>
  );
}

/* Tile background patterns used as template mocks */
function TemplateMock({ kind, palette, title, subtitle, accent }) {
  // kind: 'flyer-event', 'poster-sale', 'card', 'social-square',
  //       'social-story', 'cv', 'menu', 'flyer-corporate'
  const C = palette || ["#1a1a1a", "#2b2b2b", "#4cc2ff", "#ffffff"];
  const [bg, mid, ac, fg] = C;

  if (kind === "flyer-event") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={bg}/>
        <circle cx="100" cy="100" r="78" fill={ac} opacity=".18"/>
        <circle cx="100" cy="100" r="50" fill={ac} opacity=".35"/>
        <rect x="22" y="22" width="40" height="3" fill={ac}/>
        <text x="22" y="50" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" fontWeight="600" letterSpacing="2">EVENT · 2026</text>
        <text x="22" y="195" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="22" fontWeight="700">{title || "Soirée Live"}</text>
        <text x="22" y="213" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="10" opacity=".7">{subtitle || "Vendredi · 21:00 · Paris"}</text>
        <rect x="22" y="225" width="56" height="2" fill={ac}/>
      </svg>
    );
  }
  if (kind === "poster-sale") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={mid}/>
        <rect x="10" y="10" width="180" height="240" fill="none" stroke={ac} strokeWidth="1.5"/>
        <text x="100" y="92" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="44" fontWeight="800" textAnchor="middle">-50%</text>
        <text x="100" y="115" fill={ac} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" fontWeight="600" textAnchor="middle" letterSpacing="3">PROMOTION</text>
        <line x1="40" y1="135" x2="160" y2="135" stroke={ac} strokeWidth="1"/>
        <text x="100" y="170" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600" textAnchor="middle">Collection Hiver</text>
        <text x="100" y="187" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" textAnchor="middle" opacity=".6">Jusqu'au 28 fév.</text>
        <rect x="60" y="210" width="80" height="22" fill={ac} rx="3"/>
        <text x="100" y="225" fill={bg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" fontWeight="700" textAnchor="middle">EN BOUTIQUE</text>
      </svg>
    );
  }
  if (kind === "card") {
    return (
      <svg viewBox="0 0 260 160" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="260" height="160" fill={bg}/>
        <rect x="0" y="0" width="100" height="160" fill={ac}/>
        <circle cx="50" cy="80" r="22" fill={bg}/>
        <text x="50" y="84" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="14" fontWeight="700" textAnchor="middle">CD</text>
        <text x="120" y="60" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600">{title || "Camille Durand"}</text>
        <text x="120" y="74" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" opacity=".7">{subtitle || "Directrice artistique"}</text>
        <line x1="120" y1="86" x2="240" y2="86" stroke={fg} strokeOpacity=".15"/>
        <text x="120" y="106" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="8" opacity=".8">camille@consilium.studio</text>
        <text x="120" y="120" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="8" opacity=".8">+33 6 12 34 56 78</text>
        <text x="120" y="134" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="8" opacity=".5">consilium.studio</text>
      </svg>
    );
  }
  if (kind === "social-square") {
    return (
      <svg viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={ac} stopOpacity=".4"/>
            <stop offset="100%" stopColor={bg}/>
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#g1)"/>
        <path d="M0 130 L200 90 L200 200 L0 200Z" fill={bg} opacity=".6"/>
        <text x="100" y="100" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="22" fontWeight="700" textAnchor="middle">{title || "Nouveau"}</text>
        <text x="100" y="122" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="10" opacity=".75" textAnchor="middle">{subtitle || "Disponible maintenant"}</text>
        <circle cx="100" cy="160" r="14" fill={ac}/>
        <path d="M94 160 L98 164 L106 156" stroke={bg} strokeWidth="2" fill="none"/>
      </svg>
    );
  }
  if (kind === "social-story") {
    return (
      <svg viewBox="0 0 140 240" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="140" height="240" fill={bg}/>
        <rect x="0" y="0" width="140" height="120" fill={ac} opacity=".5"/>
        <circle cx="70" cy="60" r="28" fill={bg}/>
        <text x="70" y="65" fontFamily="Segoe UI Variable, sans-serif" fontSize="18" fontWeight="700" fill={fg} textAnchor="middle">★</text>
        <text x="70" y="146" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="700" textAnchor="middle">Story</text>
        <text x="70" y="160" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="8" opacity=".7" textAnchor="middle">Glisse pour voir</text>
        <rect x="20" y="200" width="100" height="2" fill={fg} opacity=".3" rx="1"/>
        <rect x="20" y="200" width="40" height="2" fill={ac} rx="1"/>
      </svg>
    );
  }
  if (kind === "cv") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={fg}/>
        <rect x="0" y="0" width="70" height="260" fill={bg}/>
        <circle cx="35" cy="46" r="20" fill={ac} opacity=".6"/>
        <text x="35" y="86" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" fontWeight="600" textAnchor="middle" letterSpacing="1">EXPÉRIENCE</text>
        <rect x="14" y="94" width="42" height="1" fill={ac}/>
        <rect x="14" y="102" width="42" height="2" fill={fg} opacity=".3"/>
        <rect x="14" y="108" width="32" height="2" fill={fg} opacity=".2"/>
        <rect x="14" y="120" width="42" height="2" fill={fg} opacity=".3"/>
        <rect x="14" y="126" width="28" height="2" fill={fg} opacity=".2"/>
        <text x="14" y="158" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" fontWeight="600" letterSpacing="1">FORMATION</text>
        <rect x="14" y="166" width="42" height="1" fill={ac}/>
        <rect x="14" y="172" width="42" height="2" fill={fg} opacity=".3"/>
        <rect x="14" y="178" width="34" height="2" fill={fg} opacity=".2"/>
        <text x="90" y="40" fill={bg} fontFamily="Segoe UI Variable, sans-serif" fontSize="14" fontWeight="700">Léa Martin</text>
        <text x="90" y="54" fill={bg} fontFamily="Segoe UI Variable, sans-serif" fontSize="8" opacity=".6">Designer Produit</text>
        <line x1="90" y1="62" x2="186" y2="62" stroke={ac}/>
        <rect x="90" y="78" width="80" height="3" fill={bg} opacity=".2"/>
        <rect x="90" y="86" width="92" height="3" fill={bg} opacity=".2"/>
        <rect x="90" y="94" width="70" height="3" fill={bg} opacity=".2"/>
        <rect x="90" y="118" width="50" height="6" fill={ac}/>
        <text x="115" y="123" fill={bg} fontFamily="Segoe UI Variable, sans-serif" fontSize="6" fontWeight="700" textAnchor="middle">PROJETS</text>
        <rect x="90" y="134" width="92" height="3" fill={bg} opacity=".2"/>
        <rect x="90" y="142" width="80" height="3" fill={bg} opacity=".2"/>
      </svg>
    );
  }
  if (kind === "menu") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={bg}/>
        <text x="100" y="40" fill={ac} fontFamily="Segoe UI Variable, sans-serif" fontSize="8" textAnchor="middle" letterSpacing="3">— MENU —</text>
        <text x="100" y="64" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="18" fontWeight="700" textAnchor="middle">Le Comptoir</text>
        <line x1="60" y1="76" x2="140" y2="76" stroke={ac}/>
        <text x="22" y="100" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" fontWeight="600">Entrées</text>
        <text x="22" y="114" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7">Burrata · tomates anciennes</text>
        <text x="178" y="114" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7" textAnchor="end">12€</text>
        <text x="22" y="126" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7">Tartare de saumon</text>
        <text x="178" y="126" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7" textAnchor="end">14€</text>
        <text x="22" y="148" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" fontWeight="600">Plats</text>
        <text x="22" y="162" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7">Magret de canard</text>
        <text x="178" y="162" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7" textAnchor="end">22€</text>
        <text x="22" y="174" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7">Risotto truffe</text>
        <text x="178" y="174" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7" textAnchor="end">24€</text>
        <text x="22" y="196" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" fontWeight="600">Desserts</text>
        <text x="22" y="210" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7">Tarte au citron</text>
        <text x="178" y="210" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".7" textAnchor="end">9€</text>
      </svg>
    );
  }
  if (kind === "flyer-corporate") {
    return (
      <svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMid slice" style={{ display: "block", width: "100%", height: "auto" }}>
        <rect width="200" height="260" fill={bg}/>
        <rect x="0" y="0" width="200" height="80" fill={mid}/>
        <rect x="16" y="16" width="32" height="3" fill={ac}/>
        <text x="16" y="42" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="9" fontWeight="600" letterSpacing="2">RAPPORT · 2026</text>
        <text x="16" y="62" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="16" fontWeight="700">Bilan annuel</text>
        <g transform="translate(16,100)">
          <rect width="80" height="44" fill={mid} rx="3"/>
          <text x="10" y="16" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="6" opacity=".6">CHIFFRE</text>
          <text x="10" y="34" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="14" fontWeight="700">€ 2,4M</text>
        </g>
        <g transform="translate(104,100)">
          <rect width="80" height="44" fill={mid} rx="3"/>
          <text x="10" y="16" fill={ac} fontFamily="Segoe UI Variable, sans-serif" fontSize="6" opacity=".9">+ 18%</text>
          <text x="10" y="34" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="14" fontWeight="700">Croissance</text>
        </g>
        <polyline points="16,200 50,180 80,190 110,165 145,170 184,150" stroke={ac} strokeWidth="1.5" fill="none"/>
        <line x1="16" y1="220" x2="184" y2="220" stroke={fg} strokeOpacity=".15"/>
        <text x="16" y="240" fill={fg} fontFamily="Segoe UI Variable, sans-serif" fontSize="7" opacity=".5">consilium.design</text>
      </svg>
    );
  }
  return null;
}

/* Brand mark for Consilium Design — a small "C" mark in a tile */
function BrandMark({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 6,
      background: "linear-gradient(135deg, #4cc2ff 0%, #2d6e8c 100%)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 4px 12px rgba(76,194,255,.35), inset 0 1px 0 rgba(255,255,255,.25)",
      flex: "none"
    }}>
      <svg viewBox="0 0 24 24" width={size * 0.6} height={size * 0.6} fill="none">
        <path d="M17 7.5A6.5 6.5 0 1 0 17 16.5" stroke="#0a1a23" strokeWidth="2.4" strokeLinecap="round"/>
        <circle cx="17" cy="12" r="1.4" fill="#0a1a23"/>
      </svg>
    </div>
  );
}

Object.assign(window, { Ico, WindowChrome, Kbd, StatTile, SectionRow, SystemTray, Avatar, TemplateMock, BrandMark });
