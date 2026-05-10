// poster-mocks.jsx — CSS-rendered flyer/poster mocks for the prototype.
// These pretend to be IA-generated visuals. Each mock takes a tiny brief and
// renders a designed poster inside a fixed aspect-ratio container.

// PosterFrame: provides the canvas; fits parent and scales content to fit
function PosterFrame({ children, ratio = "1/1", style, accent }) {
  return (
    <div style={{
      position: "relative", width: "100%", aspectRatio: ratio,
      borderRadius: 10, overflow: "hidden",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), 0 12px 32px rgba(0,0,0,0.4)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// MOCK 1 — Bold typographic event flyer (terracotta on cream)
function PosterEditorial({ title = "Soirée\nAfter Work", date = "Vendredi 12 Mai", venue = "Le Loft · Paris 10", brand = "EVENTLAB", ratio = "1/1" }) {
  return (
    <PosterFrame ratio={ratio}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(160deg, #f4ecd8 0%, #e8dcc0 100%)",
        color: "#231a10",
        padding: "8% 7%", display: "flex", flexDirection: "column", justifyContent: "space-between",
        fontFamily: "var(--font-sans)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "1.4cqw" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.08em" }}>{brand}</span>
          <span style={{ fontFamily: "var(--font-mono)", color: "#5d4a30" }}>'25</span>
        </div>
        <div style={{
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "9.5cqw", lineHeight: 0.9, letterSpacing: "-0.04em",
          whiteSpace: "pre-line", color: "#c66a45",
        }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "1.6cqw" }}>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600 }}>{date}</div>
            <div style={{ color: "#5d4a30" }}>{venue}</div>
          </div>
          <div style={{
            width: "12cqw", height: "12cqw", borderRadius: "50%",
            background: "#231a10", color: "#f4ecd8",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: "2cqw", fontWeight: 600,
            transform: "rotate(-8deg)",
          }}>RSVP</div>
        </div>
      </div>
    </PosterFrame>
  );
}

// MOCK 2 — Restaurant menu / promo (warm dark)
function PosterMenu({ title = "Brunch\nDominical", price = "18€", brand = "MAISON CAFÉ", ratio = "1080/1920" }) {
  return (
    <PosterFrame ratio={ratio}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(120% 80% at 30% 20%, #3a2418 0%, #1a0e08 80%)",
        color: "#f4ecd8",
        padding: "10% 8%", display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <div style={{ fontSize: "2cqw", fontFamily: "var(--font-mono)", letterSpacing: "0.1em", color: "#d8a85a" }}>
          {brand}
        </div>
        <div>
          <div style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400,
            fontSize: "12cqw", lineHeight: 0.95, letterSpacing: "-0.02em",
            whiteSpace: "pre-line",
          }}>{title}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "2cqw", marginTop: "4cqw" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "10cqw", fontWeight: 600, color: "#e08a64" }}>{price}</span>
            <span style={{ fontSize: "2cqw", color: "#d8c5a3" }}>par personne</span>
          </div>
        </div>
        <div style={{
          padding: "3cqw 4cqw", border: "1px solid rgba(244,236,216,0.2)", borderRadius: "1.5cqw",
          alignSelf: "flex-start", fontSize: "1.8cqw", color: "#d8c5a3",
          fontFamily: "var(--font-mono)",
        }}>10h — 15h · réservation conseillée</div>
      </div>
    </PosterFrame>
  );
}

// MOCK 3 — Story Instagram, vibrant gradient, fashion / launch
function PosterLaunch({ title = "Drop\nÉté '25", subtitle = "Nouvelle collection", brand = "MAREA", ratio = "1080/1920" }) {
  return (
    <PosterFrame ratio={ratio}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #f0c089 0%, #e08a64 40%, #b85c3e 100%)",
        overflow: "hidden",
      }}>
        {/* Sun shape */}
        <div style={{
          position: "absolute", top: "8%", right: "-10%",
          width: "80%", aspectRatio: "1/1", borderRadius: "50%",
          background: "radial-gradient(circle at 30% 30%, #fce5c0, #f0c089 60%, transparent 70%)",
          mixBlendMode: "soft-light",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          padding: "10% 8%", color: "#1a0e08",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "2cqw", letterSpacing: "0.15em" }}>
            {brand} · NEW
          </div>
          <div style={{
            fontFamily: "var(--font-serif)", fontStyle: "italic",
            fontSize: "16cqw", lineHeight: 0.85,
            whiteSpace: "pre-line", letterSpacing: "-0.03em", color: "#1a0e08",
          }}>{title}</div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-end",
            fontSize: "2.2cqw",
          }}>
            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{subtitle}</div>
            <div style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>SHOP →</div>
          </div>
        </div>
      </div>
    </PosterFrame>
  );
}

// MOCK 4 — Sale / promo, big number
function PosterSale({ percent = "40", label = "SOLDES", brand = "BOUTIQUE 22", ratio = "1/1" }) {
  return (
    <PosterFrame ratio={ratio}>
      <div style={{
        position: "absolute", inset: 0,
        background: "#1a0e08",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: "8%",
          border: "2px solid #d8a85a",
          borderRadius: "2%",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          color: "#f4ecd8", textAlign: "center",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.5cqw", letterSpacing: "0.4em", color: "#d8a85a", marginBottom: "2cqw" }}>{label}</div>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 700,
            fontSize: "42cqw", lineHeight: 0.85, letterSpacing: "-0.06em",
            color: "#e08a64",
          }}>{percent}<span style={{ fontSize: "20cqw", color: "#d8a85a" }}>%</span></div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "5cqw", fontWeight: 500, marginTop: "2cqw" }}>jusqu'au 30 juin</div>
          <div style={{
            marginTop: "4cqw", padding: "2cqw 4cqw",
            border: "1px solid rgba(244,236,216,0.3)", borderRadius: "1cqw",
            fontFamily: "var(--font-mono)", fontSize: "1.8cqw", letterSpacing: "0.1em",
          }}>{brand}</div>
        </div>
      </div>
    </PosterFrame>
  );
}

// MOCK 5 — Corporate / SaaS announcement
function PosterCorp({ title = "Lancement\nProduit", date = "Q3 2025", brand = "NORTH LABS", ratio = "1/1" }) {
  return (
    <PosterFrame ratio={ratio}>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, #f7f3ec 0%, #e8e2d2 100%)",
        color: "#1d1611", padding: "6% 6%",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.6cqw" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.1em" }}>{brand}</span>
          <span style={{ fontFamily: "var(--font-mono)", color: "#6b5d4f" }}>{date}</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{
            fontFamily: "var(--font-display)", fontWeight: 600,
            fontSize: "11cqw", lineHeight: 0.95, letterSpacing: "-0.04em",
            whiteSpace: "pre-line",
          }}>{title}</div>
        </div>
        {/* Geometric mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "3cqw" }}>
          <svg width="20%" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
            <circle cx="30" cy="50" r="22" fill="#c66a45" />
            <circle cx="60" cy="50" r="22" fill="#1d1611" style={{ mixBlendMode: "multiply" }}/>
          </svg>
          <div style={{ fontSize: "1.8cqw", color: "#6b5d4f", lineHeight: 1.4 }}>
            Une nouvelle façon de<br/>concevoir vos campagnes.
          </div>
        </div>
      </div>
    </PosterFrame>
  );
}

// MOCK 6 — Music / artist
function PosterMusic({ title = "Live\nSession", artist = "MARA & THE WAVES", date = "23.06", venue = "La Bellevilloise", ratio = "1080/1920" }) {
  return (
    <PosterFrame ratio={ratio}>
      <div style={{
        position: "absolute", inset: 0,
        background: "#0d0805",
        overflow: "hidden",
      }}>
        {/* Halftone-ish dots */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(#e08a64 1px, transparent 1.5px)",
          backgroundSize: "12px 12px",
          opacity: 0.25,
          maskImage: "radial-gradient(80% 60% at 50% 35%, black, transparent)",
          WebkitMaskImage: "radial-gradient(80% 60% at 50% 35%, black, transparent)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          padding: "10% 7%", color: "#f4ecd8",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "2cqw", letterSpacing: "0.2em" }}>{artist}</div>
          <div style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
            fontSize: "20cqw", lineHeight: 0.85, color: "#e08a64",
            whiteSpace: "pre-line", letterSpacing: "-0.03em",
          }}>{title}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", fontSize: "2cqw" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "5cqw", fontWeight: 500 }}>{date}</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "#d8c5a3" }}>{venue}</span>
          </div>
        </div>
      </div>
    </PosterFrame>
  );
}

// MOCK 7 — Wireframe / loading skeleton poster (used for in-progress generation)
function PosterSkeleton({ ratio = "1/1", phase = "imagining", progress = 0.5 }) {
  return (
    <PosterFrame ratio={ratio} style={{ background: "var(--bg-3)" }}>
      <div style={{
        position: "absolute", inset: 0, padding: "8%",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        opacity: 0.6,
      }}>
        <Skeleton w="40%" h={10} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton w="80%" h={32} />
          <Skeleton w="55%" h={32} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Skeleton w={48} h={12} />
          <Skeleton w={80} h={12} />
        </div>
      </div>
      <div style={{
        position: "absolute", left: 0, bottom: 0, right: 0,
        padding: "8%", display: "flex", flexDirection: "column", gap: 8,
        background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.4))",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--ink-1)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "var(--acc)",
              animation: "pulse 1.4s ease-in-out infinite",
            }} />
            {phase}…
          </span>
          <span style={{ color: "var(--ink-2)" }}>{Math.round(progress * 100)}%</span>
        </div>
        <div style={{ width: "100%", height: 3, background: "var(--bg-1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--acc)", transition: "width 400ms" }} />
        </div>
      </div>
    </PosterFrame>
  );
}

// Switcher: pick mock by kind
const POSTER_KINDS = ["editorial", "menu", "launch", "sale", "corp", "music"];
function Poster({ kind = "editorial", ratio, brief = {} }) {
  const props = { ratio, ...brief };
  switch (kind) {
    case "menu":      return <PosterMenu {...props} />;
    case "launch":    return <PosterLaunch {...props} />;
    case "sale":      return <PosterSale {...props} />;
    case "corp":      return <PosterCorp {...props} />;
    case "music":     return <PosterMusic {...props} />;
    case "skeleton":  return <PosterSkeleton {...props} />;
    default:          return <PosterEditorial {...props} />;
  }
}

Object.assign(window, { Poster, PosterFrame, POSTER_KINDS,
  PosterEditorial, PosterMenu, PosterLaunch, PosterSale, PosterCorp, PosterMusic, PosterSkeleton });
