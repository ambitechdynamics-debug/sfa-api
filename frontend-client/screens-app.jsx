// screens-app.jsx — AppShell, Dashboard, History, Project detail

// ─────────────────────────────────────────────
// AppShell — sidebar + header + main
// ─────────────────────────────────────────────
function AppShell({ children }) {
  const { route, goto } = useNav();
  const { auth, signOut, notifOpen, setNotifOpen } = useApp();
  if (!auth.signedIn) {
    // Mock auto-login for direct dashboard navigation
    return null;
  }
  const navItems = [
    { name: "dashboard", label: "Tableau de bord", icon: "home" },
    { name: "create",    label: "Créer un visuel", icon: "sparkles", primary: true },
    { name: "history",   label: "Mes projets",     icon: "folder", count: MOCK_PROJECTS.length },
    { name: "canvas",    label: "Toile (autres écrans)", icon: "layout" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100vh", background: "var(--bg-0)" }}>
      {/* Sidebar */}
      <aside style={{
        position: "sticky", top: 0, alignSelf: "start",
        height: "100vh", display: "flex", flexDirection: "column",
        background: "var(--bg-1)", borderRight: "1px solid var(--line-1)",
        padding: "20px 14px",
      }}>
        <div style={{ padding: "0 8px", marginBottom: 24 }}>
          <BrandMark size={20} />
        </div>

        <Button size="md" full icon="sparkles" onClick={() => goto("create")} style={{ marginBottom: 20 }}>
          Créer un visuel
        </Button>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          <SidebarLabel>Workspace</SidebarLabel>
          {navItems.map(it => (
            <SidebarItem key={it.name}
              label={it.label}
              icon={it.icon}
              active={route.name === it.name || (it.name === "history" && route.name === "project")}
              count={it.count}
              onClick={() => goto(it.name)}
            />
          ))}

          <SidebarLabel style={{ marginTop: 18 }}>Bibliothèque</SidebarLabel>
          <SidebarItem label="Mémoires de marque" icon="palette" />
          <SidebarItem label="Templates"          icon="layers" />
          <SidebarItem label="Médias"             icon="image" />

          <SidebarLabel style={{ marginTop: 18 }}>Compte</SidebarLabel>
          <SidebarItem label="Abonnement & crédits" icon="credit" onClick={() => goto("canvas")} />
          <SidebarItem label="Profil"                icon="user" onClick={() => goto("canvas")} />
          <SidebarItem label="Paramètres IA"         icon="wand" onClick={() => goto("canvas")} />
          <SidebarItem label="Support"               icon="help" onClick={() => goto("canvas")} />
        </nav>

        {/* Credits widget */}
        <div style={{
          padding: 14, background: "var(--bg-2)", border: "1px solid var(--line-1)",
          borderRadius: 12, display: "flex", flexDirection: "column", gap: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Crédits IA</span>
            <Badge size="sm" tone="acc">Pro</Badge>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="display" style={{ fontSize: 22, fontWeight: 600 }}>{MOCK_USER.credits}</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>/ {MOCK_USER.creditsTotal}</span>
          </div>
          <div style={{ height: 4, background: "var(--bg-1)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${(MOCK_USER.credits / MOCK_USER.creditsTotal) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--acc-bright), var(--acc-deep))" }} />
          </div>
          <Button size="sm" variant="outline" full iconRight="arrowR" onClick={() => goto("canvas")}>Recharger</Button>
        </div>

        <div style={{
          marginTop: 14, padding: "10px 8px",
          display: "flex", alignItems: "center", gap: 10,
          borderRadius: 10, cursor: "pointer",
        }}>
          <Avatar name={MOCK_USER.name} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{MOCK_USER.name}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{MOCK_USER.email}</div>
          </div>
          <button onClick={signOut} style={{
            background: "transparent", border: 0, color: "var(--ink-3)",
            padding: 6, borderRadius: 6, cursor: "pointer",
          }}>
            <Icon name="logout" size={14} />
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <AppHeader onBell={() => setNotifOpen(v => !v)} />
        <main style={{ flex: 1, padding: "32px 40px 60px" }}>
          {children}
        </main>
      </div>

      {/* Notifications drawer */}
      {notifOpen && <NotifDrawer onClose={() => setNotifOpen(false)} />}
    </div>
  );
}

function SidebarLabel({ children, style }) {
  return (
    <div style={{
      padding: "8px 10px",
      fontSize: 11, fontFamily: "var(--font-mono)",
      color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase",
      ...style,
    }}>{children}</div>
  );
}

function SidebarItem({ label, icon, active, count, onClick }) {
  return (
    <button onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px", textAlign: "left",
        background: active ? "var(--bg-3)" : "transparent",
        border: 0, borderRadius: 8,
        color: active ? "var(--ink-0)" : "var(--ink-2)",
        fontSize: 13, fontWeight: 500,
        cursor: "pointer", transition: "background 120ms, color 120ms",
        fontFamily: "var(--font-sans)",
      }}
      onMouseEnter={e => !active && (e.currentTarget.style.background = "var(--bg-2)", e.currentTarget.style.color = "var(--ink-1)")}
      onMouseLeave={e => !active && (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "var(--ink-2)")}
    >
      <Icon name={icon} size={15} />
      <span style={{ flex: 1 }}>{label}</span>
      {count !== undefined && (
        <span style={{
          padding: "1px 6px", background: "var(--bg-3)", color: "var(--ink-2)",
          borderRadius: 4, fontSize: 11,
        }}>{count}</span>
      )}
    </button>
  );
}

function AppHeader({ onBell }) {
  const { route } = useNav();
  const titles = {
    dashboard: "Tableau de bord",
    create:    "Créer un visuel",
    result:    "Résultat de génération",
    history:   "Mes projets",
    project:   "Détail projet",
    canvas:    "Toile : autres écrans",
  };
  const unread = NOTIFICATIONS.filter(n => n.unread).length;

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      display: "flex", alignItems: "center", gap: 16,
      padding: "16px 40px", background: "rgba(16,12,8,0.65)",
      backdropFilter: "blur(14px) saturate(160%)",
      WebkitBackdropFilter: "blur(14px) saturate(160%)",
      borderBottom: "1px solid var(--line-1)",
    }}>
      <h1 className="display" style={{ fontSize: 18, margin: 0, fontWeight: 500 }}>
        {titles[route.name] || ""}
      </h1>
      <div style={{ flex: 1 }} />
      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        height: 36, padding: "0 12px",
        background: "var(--bg-2)", border: "1px solid var(--line-1)",
        borderRadius: 999, color: "var(--ink-3)", fontSize: 13,
        width: 280,
      }}>
        <Icon name="search" size={14} />
        <input placeholder="Rechercher un projet, un client…" style={{
          flex: 1, background: "transparent", border: 0, outline: 0,
          color: "var(--ink-1)", fontSize: 13, fontFamily: "var(--font-sans)",
        }} />
        <Kbd>⌘K</Kbd>
      </div>
      <button onClick={onBell} style={{
        position: "relative", width: 36, height: 36, borderRadius: 8,
        background: "var(--bg-2)", border: "1px solid var(--line-1)",
        color: "var(--ink-1)", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="bell" size={15} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 6, right: 6,
            width: 7, height: 7, borderRadius: "50%",
            background: "var(--acc)", border: "2px solid var(--bg-2)",
          }} />
        )}
      </button>
      <Avatar name={MOCK_USER.name} size={32} />
    </header>
  );
}

function NotifDrawer({ onClose }) {
  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
        zIndex: 90, animation: "fadeIn 200ms",
      }} />
      <aside style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 380,
        zIndex: 100, background: "var(--bg-1)", borderLeft: "1px solid var(--line-2)",
        boxShadow: "var(--sh-3)",
        display: "flex", flexDirection: "column",
        animation: "fadeUp 240ms ease",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: "1px solid var(--line-1)",
        }}>
          <div className="display" style={{ fontSize: 17, margin: 0 }}>Notifications</div>
          <button onClick={onClose} style={{
            background: "transparent", border: 0, color: "var(--ink-2)",
            padding: 6, borderRadius: 6, cursor: "pointer",
          }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {NOTIFICATIONS.map(n => (
            <div key={n.id} style={{
              display: "flex", gap: 12, padding: 12, borderRadius: 10,
              background: n.unread ? "var(--bg-2)" : "transparent",
              border: "1px solid",
              borderColor: n.unread ? "var(--line-1)" : "transparent",
            }}>
              <span style={{
                flexShrink: 0,
                width: 32, height: 32, borderRadius: 8,
                background: `var(--${n.tone}-soft)`,
                color: `var(--${n.tone === "acc" ? "acc-bright" : n.tone})`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}><Icon name={n.icon} size={15} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-0)" }}>{n.title}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2, lineHeight: 1.5 }}>{n.body}</div>
              </div>
              {n.unread && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--acc)", marginTop: 6 }} />}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
function ScreenDashboard() {
  const { goto } = useNav();
  const { projects } = useApp();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Hello banner */}
      <div style={{
        position: "relative", overflow: "hidden",
        padding: "32px 32px",
        background: "linear-gradient(135deg, #2a1a10 0%, #1a0e08 60%)",
        border: "1px solid var(--line-1)", borderRadius: 18,
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(245,238,226,0.08) 1px, transparent 1.4px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(60% 100% at 100% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(60% 100% at 100% 50%, black, transparent)",
        }} />
        <div aria-hidden style={{
          position: "absolute", right: -50, top: -50, width: 320, height: 320, borderRadius: "50%",
          background: "radial-gradient(circle, var(--acc-soft), transparent 70%)",
          filter: "blur(20px)",
        }} />
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--acc)", letterSpacing: "0.1em", marginBottom: 8 }}>
              MERCREDI 14 MAI · 14:23
            </div>
            <h2 className="display" style={{ fontSize: 32, margin: 0, letterSpacing: "-0.03em", color: "#f4ecd8" }}>
              Bonjour Amélie. <span className="serif" style={{ color: "var(--acc)" }}>Que créons-nous</span> aujourd'hui ?
            </h2>
            <p style={{ marginTop: 12, fontSize: 14, color: "rgba(244,236,216,0.7)", maxWidth: 540, lineHeight: 1.55 }}>
              Vous avez 2 brouillons en attente et 1 retouche à valider. Votre prochain visuel se trouve à un brief près.
            </p>
            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              <Button size="lg" icon="sparkles" onClick={() => goto("create")}>Créer un nouveau visuel</Button>
              <Button size="lg" variant="ghost" iconRight="arrowR" onClick={() => goto("history")} style={{ color: "#f4ecd8" }}>Voir mes projets</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Visuels créés"        value="42"  delta="+12 ce mois" icon="image"   accent="acc" />
        <StatCard label="Demandes en cours"    value="2"   delta="+1 hier"     icon="layers" />
        <StatCard label="Retouches restantes"  value="∞"                       icon="wand" />
        <StatCard label="Crédits IA disponibles" value={MOCK_USER.credits + " / " + MOCK_USER.creditsTotal} delta="-13 cette semaine" icon="credit" />
      </div>

      {/* Recent projects + quick start */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <Card padding={0}>
          <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--line-1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="display" style={{ fontSize: 17 }}>Derniers projets</div>
            <a onClick={() => goto("history")} style={{ fontSize: 13, color: "var(--acc)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>
              Tout voir <Icon name="arrowR" size={13} />
            </a>
          </div>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {projects.slice(0, 3).map(p => (
              <ProjectCard key={p.id} project={p} onClick={() => goto("project", { id: p.id })} />
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* AI tip */}
          <Card>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--acc-soft)", color: "var(--acc-bright)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}><Icon name="sparkles" size={16} /></span>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em" }}>CONSEIL IA</div>
                <div className="display" style={{ fontSize: 16, marginTop: 2 }}>Plus précis = plus utile</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Pour de meilleurs visuels, mentionnez le public cible et l'émotion recherchée — pas seulement le sujet. Exemple : « rassurer une cliente CSP+ qui hésite » au lieu de « campagne immobilier ».
            </p>
            <Button variant="ghost" size="sm" iconRight="arrowR" style={{ marginTop: 10, padding: 0 }}>Voir tous les conseils</Button>
          </Card>

          {/* Quick start */}
          <Card>
            <div className="display" style={{ fontSize: 16, marginBottom: 12 }}>Démarrage rapide</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { icon: "calendar", label: "Affiche événement" },
                { icon: "rocket",   label: "Story Instagram" },
                { icon: "tag",      label: "Promo / soldes" },
                { icon: "type",     label: "Menu restaurant" },
              ].map(q => (
                <button key={q.label} onClick={() => goto("create")} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", textAlign: "left",
                  background: "var(--bg-1)", border: "1px solid var(--line-1)",
                  borderRadius: 8, cursor: "pointer",
                  color: "var(--ink-1)", fontSize: 13, fontWeight: 500,
                  fontFamily: "var(--font-sans)",
                }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: "var(--bg-3)", color: "var(--ink-1)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name={q.icon} size={13} /></span>
                  <span style={{ flex: 1 }}>{q.label}</span>
                  <Icon name="arrowR" size={13} style={{ color: "var(--ink-3)" }} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent generations */}
      <div>
        <SectionTitle
          overline="Générations récentes"
          title="Vos derniers visuels créés par l'IA"
          action={<Tabs value="all" onChange={() => {}} options={[
            { value: "all", label: "Tous", count: 12 },
            { value: "validated", label: "Validés", count: 8 },
            { value: "draft", label: "Brouillons", count: 2 },
          ]} />}
        />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
          {projects.slice(0, 6).map(p => (
            <div key={"mini-" + p.id} style={{ cursor: "pointer" }} onClick={() => goto("project", { id: p.id })}>
              <Poster {...p.poster} />
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 500, color: "var(--ink-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{p.updatedAt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ProjectCard (used in dashboard + history)
// ─────────────────────────────────────────────
function ProjectCard({ project, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: 0, background: "var(--bg-1)", border: "1px solid var(--line-1)",
      borderRadius: 14, overflow: "hidden", cursor: "pointer",
      transition: "transform 200ms, border-color 200ms",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = "var(--line-3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "var(--line-1)"; }}
    >
      <div style={{ padding: 12, paddingBottom: 0 }}>
        <Poster {...project.poster} />
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-0)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {project.title}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name={project.typeIcon} size={11} />
              {project.type} · {project.updatedAt}
            </div>
          </div>
          <Badge size="sm" tone={project.statusTone} dot>{project.status}</Badge>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// History
// ─────────────────────────────────────────────
function ScreenHistory() {
  const { goto } = useNav();
  const { projects } = useApp();
  const [view, setView] = React.useState("grid");
  const [filter, setFilter] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const counts = {
    all: projects.length,
    valide: projects.filter(p => p.status === "validé").length,
    encours: projects.filter(p => p.status === "en cours").length,
    brouillon: projects.filter(p => p.status === "brouillon").length,
    retouche: projects.filter(p => p.status === "retouche demandée").length,
  };

  const filtered = projects.filter(p => {
    if (filter === "valide" && p.status !== "validé") return false;
    if (filter === "encours" && p.status !== "en cours") return false;
    if (filter === "brouillon" && p.status !== "brouillon") return false;
    if (filter === "retouche" && p.status !== "retouche demandée") return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <SectionTitle
        title={`${projects.length} projets`}
        subtitle="Vos brouillons, générations et visuels validés."
        action={<Button icon="sparkles" onClick={() => goto("create")}>Nouveau visuel</Button>}
      />

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <Tabs value={filter} onChange={setFilter} options={[
          { value: "all",       label: "Tous",       count: counts.all },
          { value: "valide",    label: "Validés",    count: counts.valide },
          { value: "encours",   label: "En cours",   count: counts.encours },
          { value: "retouche",  label: "Retouches",  count: counts.retouche },
          { value: "brouillon", label: "Brouillons", count: counts.brouillon },
        ]} />
        <div style={{ display: "flex", gap: 8 }}>
          <Input icon="search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <Button variant="outline" size="md" icon="filter">Type</Button>
          <Button variant="outline" size="md" icon="calendar">Date</Button>
          <div style={{
            display: "inline-flex", padding: 3, gap: 2,
            background: "var(--bg-2)", border: "1px solid var(--line-1)",
            borderRadius: 8,
          }}>
            <button onClick={() => setView("grid")} style={{
              width: 28, height: 28, borderRadius: 6,
              background: view === "grid" ? "var(--bg-4)" : "transparent",
              color: view === "grid" ? "var(--ink-0)" : "var(--ink-2)",
              border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><Icon name="grid" size={14} /></button>
            <button onClick={() => setView("list")} style={{
              width: 28, height: 28, borderRadius: 6,
              background: view === "list" ? "var(--bg-4)" : "transparent",
              color: view === "list" ? "var(--ink-0)" : "var(--ink-2)",
              border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><Icon name="list" size={14} /></button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="folder"
          title="Aucun projet ne correspond"
          desc="Essayez de changer de filtre ou de réinitialiser la recherche."
          action={<Button variant="outline" onClick={() => { setFilter("all"); setSearch(""); }}>Réinitialiser</Button>}
        />
      ) : view === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {filtered.map(p => <ProjectCard key={p.id} project={p} onClick={() => goto("project", { id: p.id })} />)}
        </div>
      ) : (
        <Card padding={0}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line-1)" }}>
                {["Visuel", "Type", "Statut", "Versions", "Modifié", ""].map(h => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontFamily: "var(--font-mono)",
                    color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase",
                    fontWeight: 500,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--line-1)" : 0,
                  cursor: "pointer", transition: "background 120ms",
                }}
                  onClick={() => goto("project", { id: p.id })}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
                        <Poster {...p.poster} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{p.title}</div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--ink-2)" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <Icon name={p.typeIcon} size={12} /> {p.type}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}><Badge size="sm" tone={p.statusTone} dot>{p.status}</Badge></td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--ink-2)" }}>{p.versions} versions</td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--ink-2)" }}>{p.updatedAt}</td>
                  <td style={{ padding: "10px 16px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button style={iconBtnStyle()}><Icon name="copy" size={14} /></button>
                      <button style={iconBtnStyle()}><Icon name="download" size={14} /></button>
                      <button style={iconBtnStyle()}><Icon name="more" size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function iconBtnStyle() {
  return {
    width: 28, height: 28, borderRadius: 6,
    background: "transparent", border: "1px solid var(--line-1)",
    color: "var(--ink-2)", cursor: "pointer",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
  };
}

// ─────────────────────────────────────────────
// Project detail
// ─────────────────────────────────────────────
function ScreenProject() {
  const { route, goto } = useNav();
  const { projects } = useApp();
  const project = projects.find(p => p.id === route.params.id) || projects[0];
  const [tab, setTab] = React.useState("apercu");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-2)" }}>
        <a onClick={() => goto("history")} style={{ cursor: "pointer", color: "var(--ink-2)" }}>Mes projets</a>
        <Icon name="chevronR" size={12} style={{ color: "var(--ink-3)" }} />
        <span style={{ color: "var(--ink-0)" }}>{project.title}</span>
      </div>

      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 24 }}>
        {/* Left: hero image + tabs */}
        <div>
          <div style={{
            position: "relative",
            background: "var(--bg-1)", border: "1px solid var(--line-1)",
            borderRadius: 16, padding: 32, marginBottom: 16,
            display: "flex", justifyContent: "center", alignItems: "center",
            minHeight: 480,
          }}>
            <div style={{ width: "70%", maxWidth: 480 }}>
              <Poster {...project.poster} />
            </div>
            <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
              <button style={iconBtnStyle()}><Icon name="expand" size={14} /></button>
              <button style={iconBtnStyle()}><Icon name="share" size={14} /></button>
            </div>
          </div>

          {/* Versions strip */}
          <Card padding={16}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Versions ({project.versions})</div>
              <a style={{ fontSize: 12, color: "var(--acc)", cursor: "pointer" }}>Comparer avant / après</a>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {Array.from({ length: project.versions }).map((_, i) => (
                <div key={i} style={{
                  width: 80, aspectRatio: "1/1", borderRadius: 8, overflow: "hidden",
                  border: i === project.versions - 1 ? "2px solid var(--acc)" : "1px solid var(--line-2)",
                  cursor: "pointer", flexShrink: 0, position: "relative",
                }}>
                  <Poster {...project.poster} />
                  <div style={{
                    position: "absolute", bottom: 4, right: 4,
                    padding: "1px 6px", background: "rgba(0,0,0,0.6)",
                    color: "#f4ecd8", fontSize: 10, borderRadius: 4,
                    fontFamily: "var(--font-mono)",
                  }}>v{i + 1}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: actions + meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <Badge tone={project.statusTone} dot style={{ marginBottom: 10 }}>{project.status}</Badge>
            <h2 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 4 }}>{project.title}</h2>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
              <Icon name={project.typeIcon} size={11} style={{ verticalAlign: "-1px", marginRight: 5 }} />
              {project.type} · Modifié {project.updatedAt}
            </div>
            <div style={{ height: 1, background: "var(--line-1)", margin: "16px 0" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              <Button full icon="download" size="md">Télécharger en HD</Button>
              <Button full icon="wand" variant="secondary" size="md" onClick={() => goto("result")}>Demander une retouche</Button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Button variant="outline" icon="refresh" size="md">Régénérer</Button>
                <Button variant="outline" icon="copy" size="md">Dupliquer</Button>
              </div>
            </div>
          </Card>

          <Card>
            <Tabs value={tab} onChange={setTab} options={[
              { value: "apercu", label: "Brief" },
              { value: "prompts", label: "Prompts" },
              { value: "exports", label: "Exports" },
            ]} />
            <div style={{ marginTop: 16 }}>
              {tab === "apercu" && <BriefRecap project={project} />}
              {tab === "prompts" && <PromptList />}
              {tab === "exports" && <ExportList />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BriefRecap({ project }) {
  const items = [
    { label: "Marque", value: project.poster?.brief?.brand || "—" },
    { label: "Format", value: project.type },
    { label: "Style", value: "Élégant · Chaleureux" },
    { label: "Public cible", value: "CSP+, 28-45 ans" },
    { label: "Objectif", value: "Inviter à un événement" },
    { label: "Message", value: "Soirée After Work du vendredi 12 mai au Loft. Bar à cocktails, DJ set jusqu'à 1h." },
  ];
  return (
    <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map(it => (
        <div key={it.label} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <dt style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>{it.label}</dt>
          <dd style={{ margin: 0, fontSize: 13, color: "var(--ink-1)", lineHeight: 1.5 }}>{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PromptList() {
  const prompts = [
    { v: "v3", text: "Editorial poster, warm cream background, terracotta serif type for « Soirée After Work », elegant soft glow, party invite for adult crowd, RSVP badge bottom right", at: "il y a 12 min" },
    { v: "v2", text: "+ retouche : « plus chaleureux, baisser la dominante froide »", at: "il y a 18 min" },
    { v: "v1", text: "Initial prompt: A4 evening event poster in elegant style, cream + terracotta", at: "il y a 1 h" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {prompts.map(p => (
        <div key={p.v} style={{
          padding: 12, background: "var(--bg-1)", border: "1px solid var(--line-1)",
          borderRadius: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 11 }}>
            <Badge size="sm" tone="acc">{p.v}</Badge>
            <span style={{ color: "var(--ink-3)" }}>{p.at}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-1)", lineHeight: 1.5, fontFamily: "var(--font-mono)" }}>{p.text}</div>
        </div>
      ))}
    </div>
  );
}

function ExportList() {
  const exports = [
    { format: "PNG", res: "2160 × 2160 px",  size: "4.2 MB", icon: "image" },
    { format: "PDF", res: "300 dpi · CMJN",   size: "8.7 MB", icon: "folder" },
    { format: "JPEG", res: "1080 × 1080 px", size: "780 KB", icon: "image" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {exports.map(e => (
        <div key={e.format} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "10px 12px", background: "var(--bg-1)", border: "1px solid var(--line-1)",
          borderRadius: 8,
        }}>
          <span style={{
            width: 32, height: 32, borderRadius: 6,
            background: "var(--bg-3)", color: "var(--ink-1)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}><Icon name={e.icon} size={14} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{e.format}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{e.res} · {e.size}</div>
          </div>
          <button style={iconBtnStyle()}><Icon name="download" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  AppShell, ScreenDashboard, ScreenHistory, ScreenProject, ProjectCard,
});
