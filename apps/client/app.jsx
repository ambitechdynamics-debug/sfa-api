// app.jsx — root: router + shell + tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "#777777",
  "palette": ["#777777", "#151515", "#f5f5f5"],
  "density": "regular",
  "showGrain": true
}/*EDITMODE-END*/;

const ACCENT_PALETTES = {
  "#777777": { acc: "#777777", bright: "#888888", deep: "#666666", soft: "rgba(119,119,119,0.14)", line: "rgba(119,119,119,0.32)" },
  "#8aa57a": { acc: "#8aa57a", bright: "#9bb88a", deep: "#6d8a5e", soft: "rgba(138,165,122,0.14)", line: "rgba(138,165,122,0.32)" },
  "#b08bc7": { acc: "#b08bc7", bright: "#c2a3d4", deep: "#8e6ba8", soft: "rgba(176,139,199,0.14)", line: "rgba(176,139,199,0.32)" },
  "#d8a85a": { acc: "#d8a85a", bright: "#e3b96d", deep: "#b88a3e", soft: "rgba(216,168,90,0.14)", line: "rgba(216,168,90,0.32)" },
  "#7aa3c9": { acc: "#7aa3c9", bright: "#8db5d8", deep: "#5d86ab", soft: "rgba(122,163,201,0.14)", line: "rgba(122,163,201,0.32)" },
};

// ── Routes ──
// public:  landing, login, register
// app:     dashboard, create, result, history, project (with id), canvas
function useRouter() {
  const [route, setRoute] = React.useState({ name: "landing", params: {} });
  const goto = React.useCallback((name, params = {}) => {
    setRoute({ name, params });
    window.scrollTo({ top: 0 });
  }, []);
  return { route, goto };
}

const RouterCtx = React.createContext(null);
const useNav = () => React.useContext(RouterCtx);

// Global app data (live, shared across screens)
const AppCtx = React.createContext(null);
function useApp() { return React.useContext(AppCtx); }

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const router = useRouter();

  // App-wide state (auth, projects, current draft, last result)
  const [auth, setAuth] = React.useState({ signedIn: false, user: null });
  const [projects, setProjects] = React.useState(MOCK_PROJECTS);
  const [draft, setDraft] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const [notifOpen, setNotifOpen] = React.useState(false);

  // Login on enter to app pages
  const signIn = () => {
    setAuth({ signedIn: true, user: MOCK_USER });
    router.goto("dashboard");
    setToast({ msg: "Bienvenue, Amélie 👋", tone: "acc" });
  };
  const signOut = () => {
    setAuth({ signedIn: false, user: null });
    router.goto("landing");
  };

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  // Apply theme + accent to root
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
    document.documentElement.setAttribute("data-density", t.density);
    const p = ACCENT_PALETTES[t.accent] || ACCENT_PALETTES["#777777"];
    const r = document.documentElement.style;
    r.setProperty("--acc", p.acc);
    r.setProperty("--acc-bright", p.bright);
    r.setProperty("--acc-deep", p.deep);
    r.setProperty("--acc-soft", p.soft);
    r.setProperty("--acc-line", p.line);
  }, [t.theme, t.density, t.accent]);

  const appCtx = {
    auth, signIn, signOut,
    projects, setProjects,
    draft, setDraft,
    setToast,
    notifOpen, setNotifOpen,
  };

  let view;
  switch (router.route.name) {
    case "landing":   view = <ScreenLanding />; break;
    case "login":     view = <ScreenLogin />; break;
    case "register":  view = <ScreenRegister />; break;
    case "dashboard": view = <AppShell><ScreenDashboard /></AppShell>; break;
    case "create":    view = <AppShell><ScreenCreate /></AppShell>; break;
    case "result":    view = <AppShell><ScreenResult /></AppShell>; break;
    case "history":   view = <AppShell><ScreenHistory /></AppShell>; break;
    case "project":   view = <AppShell><ScreenProject /></AppShell>; break;
    case "canvas":    view = <AppShell><ScreenCanvas /></AppShell>; break;
    default:          view = <ScreenLanding />;
  }

  return (
    <RouterCtx.Provider value={router}>
      <AppCtx.Provider value={appCtx}>
        <div style={{ minHeight: "100vh", background: "var(--bg-0)", color: "var(--ink-0)" }}>
          {view}
          {toast && <Toast tone={toast.tone || "acc"} icon={toast.icon || "check"} onClose={() => setToast(null)}>{toast.msg}</Toast>}

          <TweaksPanel title="Tweaks">
            <TweakSection label="Apparence" />
            <TweakRadio label="Thème" value={t.theme} options={["dark", "light"]} onChange={v => setTweak("theme", v)} />
            <TweakRadio label="Densité" value={t.density} options={["compact", "regular", "comfy"]} onChange={v => setTweak("density", v)} />
            <TweakSection label="Accent" />
            <TweakColor label="Couleur" value={t.accent}
              options={Object.keys(ACCENT_PALETTES)}
              onChange={v => setTweak("accent", v)} />
            <TweakSection label="Navigation" />
            <TweakButton onClick={() => router.goto("landing")}>Aller : Landing</TweakButton>
            <TweakButton onClick={() => { if (!auth.signedIn) setAuth({ signedIn: true, user: MOCK_USER }); router.goto("dashboard"); }}>Aller : Dashboard</TweakButton>
            <TweakButton onClick={() => { if (!auth.signedIn) setAuth({ signedIn: true, user: MOCK_USER }); router.goto("create"); }}>Aller : Création</TweakButton>
            <TweakButton onClick={() => { if (!auth.signedIn) setAuth({ signedIn: true, user: MOCK_USER }); router.goto("canvas"); }}>Aller : Toile (autres écrans)</TweakButton>
            {auth.signedIn && <TweakButton onClick={signOut}>Se déconnecter</TweakButton>}
          </TweaksPanel>
        </div>
      </AppCtx.Provider>
    </RouterCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

window.useNav = useNav;
window.useApp = useApp;
