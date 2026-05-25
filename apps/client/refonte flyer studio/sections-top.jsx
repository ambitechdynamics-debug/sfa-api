// sections-top.jsx — Header, Hero, Logos band, Pillars

/* ============================================================
   TOP NAV — fluent header acting as a window menu bar
   ============================================================ */
function TopNav({ t, lang, setLang, intensity }) {
  const [open, setOpen] = React.useState(false);
  const items = [
    { id: "templates", label: t.nav.templates, href: "#templates" },
    { id: "uses", label: t.nav.uses, href: "#uses" },
    { id: "pricing", label: t.nav.pricing, href: "#pricing" },
    { id: "reviews", label: t.nav.reviews, href: "#reviews" },
    { id: "contact", label: t.nav.contact, href: "#contact" },
  ];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      padding: "16px 0",
      background: "linear-gradient(180deg, rgba(26,26,26,.96), rgba(26,26,26,.6))",
      backdropFilter: "blur(16px) saturate(140%)",
      WebkitBackdropFilter: "blur(16px) saturate(140%)",
      borderBottom: "1px solid var(--bd-divider)",
    }}>
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {/* Brand */}
        <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          <BrandMark size={30} />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -.01 }}>{t.brand}</span>
        </a>

        {/* Desktop nav */}
        <nav className="nav-desktop" style={{ display: "flex", gap: 4, marginLeft: 20 }}>
          {items.map((it) => (
            <a key={it.id} href={it.href} className="btn-ghost" style={{
              padding: "8px 14px", borderRadius: 6, fontSize: 14,
              color: "var(--tx-secondary)", display: "inline-flex"
            }}>
              {it.label}
            </a>
          ))}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Search shortcut Win11 style */}
        <button className="hide-md" style={{
          height: 36, padding: "0 12px",
          display: "inline-flex", alignItems: "center", gap: 10,
          background: "var(--bg-input)",
          border: "1px solid var(--bd-soft-2)",
          borderRadius: 18,
          color: "var(--tx-tertiary)",
          fontSize: 13, fontFamily: "inherit",
          cursor: "pointer",
          minWidth: 220,
        }}>
          <Ico.search style={{ width: 14, height: 14 }} />
          <span style={{ flex: 1, textAlign: "left" }}>
            {lang === "fr" ? "Rechercher dans Consilium" : "Search Consilium"}
          </span>
          <Kbd>⌘</Kbd><Kbd>K</Kbd>
        </button>

        {/* Lang toggle */}
        <div style={{
          display: "inline-flex", height: 32, padding: 2,
          background: "var(--bg-elev-1)", borderRadius: 6, border: "1px solid var(--bd-soft-2)"
        }}>
          {["fr", "en"].map((L) => (
            <button key={L} onClick={() => setLang(L)} style={{
              width: 30, height: 28, fontSize: 11, fontWeight: 600,
              borderRadius: 4, border: 0, cursor: "pointer",
              background: lang === L ? "var(--accent)" : "transparent",
              color: lang === L ? "var(--accent-text-on)" : "var(--tx-secondary)",
              textTransform: "uppercase", letterSpacing: ".05em",
              fontFamily: "inherit",
            }}>{L}</button>
          ))}
        </div>

        <a href="auth/Login.html" className="btn-ghost hide-md" style={{ padding: "8px 14px", borderRadius: 6, fontSize: 14, alignItems: "center", display: "inline-flex" }}>
          {t.cta.signin}
        </a>
        <a href="auth/Login.html" className="btn btn-accent" style={{ height: 36, borderRadius: 6, textDecoration: "none" }}>
          {t.cta.launch}
          <Ico.arrow style={{ width: 14, height: 14 }} />
        </a>

        {/* Mobile menu trigger */}
        <button className="show-md btn-ghost" onClick={() => setOpen(!open)} style={{ width: 36, height: 36, padding: 0, borderRadius: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="show-md" style={{
          position: "absolute", left: 16, right: 16, top: 64,
          background: "var(--bg-app)",
          border: "1px solid var(--bd-soft-2)",
          borderRadius: 10,
          padding: 8,
          boxShadow: "var(--shadow-lg)"
        }}>
          {items.map((it) => (
            <a key={it.id} href={it.href} onClick={() => setOpen(false)} className="sb-item" style={{ height: 40 }}>
              {it.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

/* ============================================================
   HERO — centered: title + animated prompt demo + posters reveal
   ============================================================ */
const HERO_POSTERS = [
  // Cycle 1 — soirée live
  [
    { kind: "flyer-event", title: "Soirée Live", subtitle: "Ven · 21:00 · Paris", palette: ["#0a1418","#16252d","#4cc2ff","#ffffff"] },
    { kind: "social-square", title: "Live · ce soir", subtitle: "Réservez vite", palette: ["#1a1a1a","#2d2d2d","#4cc2ff","#ffffff"] },
    { kind: "social-story", title: "Live", subtitle: "Glisse pour voir", palette: ["#0e1d23","#1a3340","#76cbff","#e8f4fa"] },
  ],
  // Cycle 2 — soldes
  [
    { kind: "poster-sale", title: "−50%", subtitle: "Soldes Hiver", palette: ["#1a1a1a","#2b2b2b","#4cc2ff","#ffffff"] },
    { kind: "flyer-corporate", title: "Soldes", subtitle: "Jusqu'au 28 fév.", palette: ["#0a1418","#16252d","#4cc2ff","#ffffff"] },
    { kind: "social-square", title: "−50%", subtitle: "C'est le moment", palette: ["#1a1a1a","#2d2d2d","#76cbff","#ffffff"] },
  ],
  // Cycle 3 — boutique fleurs
  [
    { kind: "card", title: "Fleurs & Style", subtitle: "Boutique · Paris", palette: ["#0e1d23","#1a3340","#4cc2ff","#e8f4fa"] },
    { kind: "social-story", title: "Fleurs", subtitle: "Livraison Paris", palette: ["#1a1a1a","#2b2b2b","#76cbff","#ffffff"] },
    { kind: "flyer-event", title: "Atelier Fleurs", subtitle: "Sam · 14:00", palette: ["#0a1418","#16252d","#4cc2ff","#ffffff"] },
  ],
  // Cycle 4 — menu resto
  [
    { kind: "menu", title: "Le Comptoir", subtitle: "Carte hiver", palette: ["#1a1a1a","#2b2b2b","#4cc2ff","#ffffff"] },
    { kind: "social-square", title: "Nouvelle carte", subtitle: "Découvrir", palette: ["#0a1418","#16252d","#76cbff","#ffffff"] },
    { kind: "flyer-corporate", title: "Le Comptoir", subtitle: "Réservation en ligne", palette: ["#1a1a1a","#2d2d2d","#4cc2ff","#ffffff"] },
  ],
];

const HERO_PROMPTS_FR = [
  "Crée une affiche pour ma soirée live à Paris",
  "Génère un flyer pour mes soldes d'hiver −50%",
  "Carte de visite pour ma boutique de fleurs",
  "Affiche & menu pour mon restaurant",
];
const HERO_PROMPTS_EN = [
  "Create a poster for my live night in Paris",
  "Generate a flyer for my winter sale −50%",
  "Business card for my flower shop",
  "Poster & menu for my restaurant",
];

const HERO_CHIPS_FR = ["Affiche événement", "Flyer promo", "Carte de visite", "Story réseaux", "Menu resto"];
const HERO_CHIPS_EN = ["Event poster", "Promo flyer", "Business card", "Social story", "Restaurant menu"];

function HeroPromptDemo({ lang, t }) {
  const prompts = lang === "fr" ? HERO_PROMPTS_FR : HERO_PROMPTS_EN;
  const chips = lang === "fr" ? HERO_CHIPS_FR : HERO_CHIPS_EN;

  const [promptIdx, setPromptIdx] = React.useState(0);
  const [typedLen, setTypedLen] = React.useState(0);
  const [postersShown, setPostersShown] = React.useState(0);
  const [phase, setPhase] = React.useState("typing");
  // phases: typing | full | sending | generating | showing | done | resetting

  const safeIdx = promptIdx % prompts.length;
  const currentText = prompts[safeIdx];
  const currentPosters = HERO_POSTERS[safeIdx % HERO_POSTERS.length];

  // Reset prompt index when language flips so the typing always starts cleanly
  React.useEffect(() => { setPromptIdx(0); }, [lang]);

  React.useEffect(() => {
    let timers = [];
    let cancelled = false;
    const push = (fn, t) => timers.push(setTimeout(() => { if (!cancelled) fn(); }, t));

    // Reset state
    setPhase("typing");
    setTypedLen(0);
    setPostersShown(0);

    const text = currentText;
    const TYPING_DELAY_PER_CHAR = 38;
    const TYPING_START = 500;

    // Type each char
    for (let i = 1; i <= text.length; i++) {
      push(() => setTypedLen(i), TYPING_START + i * TYPING_DELAY_PER_CHAR);
    }
    const typingEnd = TYPING_START + text.length * TYPING_DELAY_PER_CHAR;

    // Pause then send
    push(() => setPhase("full"), typingEnd + 400);
    push(() => setPhase("sending"), typingEnd + 900);
    push(() => setPhase("generating"), typingEnd + 1500);

    // Posters appear
    push(() => { setPhase("showing"); setPostersShown(1); }, typingEnd + 2200);
    push(() => setPostersShown(2), typingEnd + 3300);
    push(() => setPostersShown(3), typingEnd + 4400);
    push(() => setPhase("done"), typingEnd + 5200);

    // Hold the result
    push(() => setPhase("resetting"), typingEnd + 9500);

    // Next cycle
    push(() => setPromptIdx((i) => (i + 1) % prompts.length), typingEnd + 10500);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [promptIdx, lang]);

  const showCursor = phase === "typing" || phase === "full";
  const inputBusy = phase === "sending" || phase === "generating";
  const showPlaceholder = typedLen === 0 && phase !== "generating";
  const resetting = phase === "resetting";

  return (
    <div className="prompt-demo">
      {/* Posters stage above the input */}
      <div className={`posters-stage ${resetting ? "fading" : ""}`}>
        {currentPosters.map((p, i) => {
          if (i >= postersShown) return null;
          return (
            <div
              key={`${promptIdx}-${i}`}
              className="poster-wrap"
              style={{ "--i": i, "--center": (postersShown - 1) / 2 }}
            >
              <div className="poster-card poster-anim">
                <TemplateMock kind={p.kind} palette={p.palette} title={p.title} subtitle={p.subtitle} />
                <div className="poster-meta">
                  <span className="chip-dot" />
                  {lang === "fr" ? "Généré · prêt à exporter" : "Generated · ready to export"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prompt input frame */}
      <div className={`prompt-input phase-${phase}`}>
        <div className="prompt-text">
          {showPlaceholder ? (
            <span className="prompt-placeholder">
              {lang === "fr" ? "Décrivez le visuel que vous voulez créer…" : "Describe the visual you want to create…"}
            </span>
          ) : (
            <span className="prompt-typed">{currentText.slice(0, typedLen)}</span>
          )}
          {showCursor && <span className="prompt-caret" />}
          {phase === "generating" && (
            <span className="prompt-gen">
              <span className="dot" /><span className="dot" /><span className="dot" />
              <span style={{ marginLeft: 10, color: "var(--accent)" }}>
                {lang === "fr" ? "Génération en cours…" : "Generating…"}
              </span>
            </span>
          )}
        </div>

        <div className="prompt-footer">
          <div className="prompt-tools">
            <button className="prompt-tool" aria-label="attach">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="m16 8-5.5 5.5a2 2 0 1 0 2.8 2.8l7-7a4 4 0 1 0-5.7-5.7L7 11.5a6 6 0 1 0 8.5 8.5L20 15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="prompt-tool" aria-label="format">
              <Ico.image style={{ width: 16, height: 16 }} />
            </button>
            <span style={{ fontSize: 12, color: "var(--tx-quaternary)", marginLeft: 4 }}>
              {lang === "fr" ? "A4 · Affiche" : "A4 · Poster"}
            </span>
          </div>
          <button className={`prompt-send ${inputBusy ? "busy" : ""}`} aria-label="send">
            {phase === "generating" ? (
              <span className="send-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="prompt-chips">
        {chips.map((c, i) => (
          <button key={i} className="prompt-chip">{c}</button>
        ))}
      </div>
    </div>
  );
}

function Hero({ t, lang, intensity }) {
  return (
    <section className="hero-section" style={{ position: "relative", padding: "48px 0 96px", overflow: "hidden" }}>
      <div className="hero-grid-bg" />

      {/* Soft glow blob */}
      <div style={{
        position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)",
        width: 900, height: 720, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(76,194,255,.12), transparent 60%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      <div className="container hero-centered" style={{ position: "relative" }}>
        <span className="chip chip-accent rise rise-1">
          <span className="chip-dot" />
          {t.hero.chip}
        </span>

        <h1 className="rise rise-2 hero-title" style={{
          fontSize: "clamp(36px, 5.4vw, 64px)",
          lineHeight: 1.04,
          margin: "20px auto 0",
          fontWeight: 600,
          letterSpacing: "-.03em",
          maxWidth: 920,
          textAlign: "center",
        }}>
          <span className="glow-text">{t.hero.title[0]} {t.hero.title[1]}</span>{" "}
          <span style={{ color: "var(--accent)" }}>{t.hero.title[2]}</span>
        </h1>

        <p className="rise rise-3" style={{
          marginTop: 18, fontSize: 16, lineHeight: 1.55,
          color: "var(--tx-secondary)", maxWidth: 620, textAlign: "center",
        }}>
          {t.hero.subtitle}
        </p>

        <div className="rise rise-3" style={{ marginTop: 36, width: "100%" }}>
          <HeroPromptDemo lang={lang} t={t} />
        </div>

        <div className="rise rise-4" style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <a href="auth/Signup.html" className="btn btn-accent btn-xl" style={{ textDecoration: "none" }}>
            {t.cta.tryFree}
            <Ico.arrow style={{ width: 16, height: 16 }} />
          </a>
          <a href="#templates" className="btn btn-xl" style={{ borderRadius: 6, textDecoration: "none" }}>
            <Ico.templates style={{ width: 16, height: 16 }} />
            {t.cta.seeTemplates}
          </a>
        </div>

        <div className="rise rise-4" style={{ marginTop: 22, display: "flex", gap: 22, flexWrap: "wrap", color: "var(--tx-tertiary)", fontSize: 13, justifyContent: "center" }}>
          {[t.hero.meta1, t.hero.meta2, t.hero.meta3].map((m, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Ico.check style={{ width: 14, height: 14, color: "var(--accent)" }} />{m}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroWindow({ t }) {
  const sidebarItems = [
    { id: "home", label: t.nav.home, icon: <Ico.home/> },
    { id: "tpl", label: t.nav.templates, icon: <Ico.templates/>, active: true },
    { id: "brushes", label: "Marques" === t.brand ? "" : (window.__lang === "fr" ? "Marques" : "Brands"), icon: <Ico.brush/> },
    { id: "img", label: window.__lang === "fr" ? "Bibliothèque" : "Library", icon: <Ico.image/> },
    { id: "type", label: window.__lang === "fr" ? "Polices" : "Fonts", icon: <Ico.type/> },
    { id: "team", label: window.__lang === "fr" ? "Équipe" : "Team", icon: <Ico.user/> },
    { id: "store", label: window.__lang === "fr" ? "Stockage" : "Storage", icon: <Ico.cloud/> },
    { id: "sec", label: window.__lang === "fr" ? "Sécurité" : "Security", icon: <Ico.shield/> },
  ].filter((x) => x.label);

  return (
    <WindowChrome title={t.hero.windowTitle} icon={<Ico.windows style={{color:"var(--accent)"}}/>} glass>
      <div className="hero-win-grid">
        {/* SIDEBAR */}
        <aside className="hero-win-sb">
          {/* Profile card */}
          <div style={{ display: "flex", gap: 12, padding: "16px 12px 18px", alignItems: "center" }}>
            <Avatar initials="CD" size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.hero.welcomeName}
              </div>
              <div style={{ fontSize: 11, color: "var(--tx-tertiary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.hero.welcomeSub}
              </div>
            </div>
          </div>

          <div style={{ padding: "0 8px" }}>
            {sidebarItems.map((it) => (
              <div key={it.id} className={`sb-item ${it.active ? "active" : ""}`}>
                {it.icon}<span>{it.label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main className="hero-win-main">
          {/* Search bar Win11 style at top of content */}
          <div style={{
            display: "flex", gap: 16, alignItems: "center",
            padding: "16px 28px 0",
          }}>
            <button className="win-ctl" style={{ width: 32, height: 32, borderRadius: 6 }}>
              <Ico.back style={{ width: 14, height: 14 }} />
            </button>
            <div style={{ flex: 1, position: "relative", maxWidth: 360 }}>
              <Ico.search style={{ position: "absolute", left: 10, top: 10, width: 14, height: 14, color: "var(--tx-tertiary)" }} />
              <input
                className="input"
                style={{ paddingLeft: 32, height: 34, borderRadius: 18, fontSize: 13 }}
                placeholder={window.__lang === "fr" ? "Rechercher un modèle…" : "Search a template…"}
                readOnly
              />
            </div>
          </div>

          {/* Hero title */}
          <div style={{ padding: "22px 28px 4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--tx-secondary)", fontSize: 14 }}>
              <span>{window.__lang === "fr" ? "Système" : "System"}</span>
              <Ico.chev style={{ width: 12, height: 12 }} />
              <span style={{ fontWeight: 600, color: "var(--tx-primary)", fontSize: 22 }}>
                {window.__lang === "fr" ? "Tableau de bord" : "Dashboard"}
              </span>
            </div>
          </div>

          {/* Stat tiles row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: 10,
            padding: "16px 28px 4px",
          }}>
            <StatTile
              icon={<Ico.bolt style={{ width: 14, height: 14 }} />}
              label={t.hero.stats.speed.label}
              value={t.hero.stats.speed.value}
              sub={t.hero.stats.speed.sub}
            />
            <StatTile
              icon={<Ico.templates style={{ width: 14, height: 14 }} />}
              label={t.hero.stats.models.label}
              value={t.hero.stats.models.value}
              sub={t.hero.stats.models.sub}
            />
            <StatTile
              icon={<Ico.layers style={{ width: 14, height: 14 }} />}
              label={t.hero.stats.formats.label}
              value={t.hero.stats.formats.value}
              sub={t.hero.stats.formats.sub}
            />
            <StatTile
              icon={<Ico.download style={{ width: 14, height: 14 }} />}
              label={t.hero.stats.export.label}
              value={<span style={{ fontSize: 16 }}>{t.hero.stats.export.value}</span>}
              sub={t.hero.stats.export.sub}
            />
          </div>

          {/* Workspace row + rename */}
          <div style={{
            margin: "20px 28px 0",
            padding: "16px 18px",
            background: "var(--bg-elev-1)",
            border: "1px solid var(--bd-soft)",
            borderRadius: 8,
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t.hero.device.name}</div>
              <div style={{ fontSize: 12, color: "var(--tx-tertiary)", marginTop: 2 }}>CSL-2026</div>
            </div>
            <button className="btn" style={{ height: 32 }}>{t.hero.device.rename}</button>
          </div>

          {/* Info section */}
          <div style={{ margin: "10px 28px 22px", border: "1px solid var(--bd-soft)", borderRadius: 8, background: "var(--bg-elev-1)" }}>
            <SectionRow
              icon={<Ico.info style={{ width: 18, height: 18 }} />}
              title={t.hero.device.infoTitle}
              action={<button className="btn" style={{ height: 30 }}><Ico.copy style={{ width: 12, height: 12 }} /> {window.__lang === "fr" ? "Copier" : "Copy"}</button>}
            />
            <div>
              {t.hero.device.rows.slice(0, 5).map((r, i) => (
                <div key={i} className="info-row">
                  <div className="lbl">{r[0]}</div>
                  <div className="val">{r[1]}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </WindowChrome>
  );
}

/* ============================================================
   LOGOS BAND
   ============================================================ */
function LogosBand({ t }) {
  const logos = [
    { name: "Ambitech", svg: <svg viewBox="0 0 100 24" width="100" height="24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><text x="28" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600" fill="currentColor">Ambitech</text></svg> },
    { name: "Lumen", svg: <svg viewBox="0 0 100 24" width="92" height="24"><path d="M6 4l6 16M18 4l-6 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/><text x="28" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600" fill="currentColor">Lumen.</text></svg> },
    { name: "Pétrin", svg: <svg viewBox="0 0 110 24" width="100" height="24"><rect x="4" y="6" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/><text x="24" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600" fill="currentColor">Pétrin / Paris</text></svg> },
    { name: "Comptoir", svg: <svg viewBox="0 0 130 24" width="120" height="24"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3" fill="currentColor"/><text x="26" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600" fill="currentColor">Le Comptoir</text></svg> },
    { name: "KB", svg: <svg viewBox="0 0 100 24" width="84" height="24"><text x="4" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="14" fontWeight="700" fill="currentColor">KB</text><text x="28" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="400" fill="currentColor">Coaching</text></svg> },
    { name: "Atelier", svg: <svg viewBox="0 0 110 24" width="100" height="24"><path d="M4 18l8-12 8 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round"/><text x="24" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600" fill="currentColor">Atelier ↗</text></svg> },
    { name: "Noria", svg: <svg viewBox="0 0 100 24" width="84" height="24"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" fill="none"/><text x="26" y="17" fontFamily="Segoe UI Variable, sans-serif" fontSize="13" fontWeight="600" fill="currentColor">noria</text></svg> },
  ];
  return (
    <section className="section-sm" style={{ borderTop: "1px solid var(--bd-divider)", borderBottom: "1px solid var(--bd-divider)" }}>
      <div className="container">
        <div style={{ textAlign: "center", color: "var(--tx-tertiary)", fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 22 }}>
          {t.logos.label}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 28, alignItems: "center", justifyItems: "center",
          color: "var(--tx-tertiary)",
          opacity: .85,
        }}>
          {logos.map((l) => (
            <div key={l.name} style={{ filter: "grayscale(1)", transition: "opacity .2s", opacity: .75 }}>
              {l.svg}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PILLARS — 4 feature cards Win11 style
   ============================================================ */
function Pillars({ t }) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">{t.pillars.eyebrow}</div>
          <h2 style={{ whiteSpace: "pre-line" }}>{t.pillars.title}</h2>
          <p>{t.pillars.sub}</p>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}>
          {t.pillars.items.map((it, i) => {
            const IconEl = Ico[it.icon] || Ico.sparkle;
            return (
              <div key={i} className="stat-tile pillar-tile" style={{ padding: 24 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 16,
                }}>
                  <IconEl style={{ width: 20, height: 20 }} />
                </div>
                <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6, letterSpacing: -.01 }}>{it.title}</div>
                <div style={{ fontSize: 14, color: "var(--tx-secondary)", lineHeight: 1.5 }}>{it.body}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { TopNav, Hero, HeroWindow, LogosBand, Pillars });
