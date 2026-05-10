// screens-auth.jsx — Login + Register

function AuthShell({ left, right }) {
  return (
    <div style={{
      minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr",
    }}>
      {/* Left: visual */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(160deg, #c66a45 0%, #2a1a10 70%, #1a0e08 100%)",
        padding: "48px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(245,238,226,0.16) 1px, transparent 1.4px)",
          backgroundSize: "14px 14px",
          maskImage: "radial-gradient(80% 80% at 50% 30%, black, transparent)",
          WebkitMaskImage: "radial-gradient(80% 80% at 50% 30%, black, transparent)",
        }} />
        <div style={{ position: "relative" }}>
          <BrandMark size={22} color="#f4ecd8" />
        </div>
        <div style={{ position: "relative", color: "#f4ecd8" }}>
          {left}
        </div>
        <div style={{
          position: "relative", display: "flex", alignItems: "center", gap: 12,
          color: "rgba(244,236,216,0.6)", fontSize: 12, fontFamily: "var(--font-mono)",
        }}>
          <span>© 2025 Studio Flyer AI</span>
          <span>·</span>
          <span>Paris</span>
        </div>
      </div>

      {/* Right: form */}
      <div style={{
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "48px",
        background: "var(--bg-0)",
      }}>
        <div style={{ width: "100%", maxWidth: 420, marginInline: "auto" }}>
          {right}
        </div>
      </div>
    </div>
  );
}

function ScreenLogin() {
  const { goto } = useNav();
  const { signIn } = useApp();
  const [email, setEmail] = React.useState("amelie@studio-rond.fr");
  const [pw, setPw] = React.useState("••••••••••");
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); signIn(); }, 700);
  };

  return (
    <AuthShell
      left={
        <div>
          <h2 className="display" style={{ fontSize: 40, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 20 }}>
            Re·bienvenue<br/>dans le studio.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(244,236,216,0.75)", lineHeight: 1.6, maxWidth: 420 }}>
            Reprenez vos projets là où vous les avez laissés. Vos brouillons, vos retouches en cours et vos crédits IA vous attendent.
          </p>
          <div style={{
            marginTop: 48, padding: 20,
            background: "rgba(244,236,216,0.06)",
            border: "1px solid rgba(244,236,216,0.12)",
            borderRadius: 12, backdropFilter: "blur(10px)",
            maxWidth: 380,
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Avatar name="Lucas Marin" size={36} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#f4ecd8" }}>« On gagne 4 heures par semaine sur le visuel social. »</div>
                <div style={{ fontSize: 11, color: "rgba(244,236,216,0.55)", marginTop: 6 }}>Lucas Marin · Atelier des Sens</div>
              </div>
            </div>
          </div>
        </div>
      }
      right={
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div>
            <h1 className="display" style={{ fontSize: 28, margin: 0, marginBottom: 8 }}>Connexion</h1>
            <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0 }}>
              Pas encore de compte ? <a onClick={() => goto("register")} style={{ color: "var(--acc)", cursor: "pointer", fontWeight: 500 }}>Créer un compte</a>
            </p>
          </div>

          <Button variant="outline" size="lg" full icon="google" onClick={signIn}>
            Continuer avec Google
          </Button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--line-1)" }} />
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>OU</span>
            <div style={{ flex: 1, height: 1, background: "var(--line-1)" }} />
          </div>

          <Input label="Email" icon="message" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" />

          <div>
            <Input
              label="Mot de passe"
              icon="lock"
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="••••••••"
              suffix={
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ background: "transparent", border: 0, color: "var(--ink-3)", cursor: "pointer", padding: 0, display: "inline-flex" }}>
                  <Icon name={showPw ? "eyeOff" : "eye"} size={15} />
                </button>
              }
            />
            <div style={{ marginTop: 8, textAlign: "right" }}>
              <a style={{ fontSize: 12, color: "var(--ink-2)", cursor: "pointer" }}>Mot de passe oublié ?</a>
            </div>
          </div>

          <Button type="submit" size="lg" full icon={loading ? null : "arrowR"}>
            {loading ? "Connexion…" : "Se connecter"}
          </Button>

          <div style={{
            padding: 12, background: "var(--bg-1)", border: "1px dashed var(--line-2)",
            borderRadius: 8, fontSize: 12, color: "var(--ink-2)", textAlign: "center",
          }}>
            <Icon name="info" size={12} style={{ verticalAlign: "-2px", marginRight: 6, color: "var(--ink-3)" }} />
            Démo : appuyez simplement sur « Se connecter » pour entrer dans l'app.
          </div>
        </form>
      }
    />
  );
}

function ScreenRegister() {
  const { goto } = useNav();
  const { signIn } = useApp();
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "", password: "", password2: "",
    accountType: "particulier",
    company: "",
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    signIn();
  };

  return (
    <AuthShell
      left={
        <div>
          <h2 className="display" style={{ fontSize: 40, lineHeight: 1, letterSpacing: "-0.03em", marginBottom: 20 }}>
            Trois générations<br/>offertes pour <span className="serif" style={{ color: "var(--acc)" }}>commencer</span>.
          </h2>
          <p style={{ fontSize: 15, color: "rgba(244,236,216,0.75)", lineHeight: 1.6, maxWidth: 420 }}>
            Aucune carte bancaire. Aucun engagement. Vos visuels sont à vous, libres de droits, dès la première génération.
          </p>
          <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 14, maxWidth: 380 }}>
            {[
              "Briefer en français, en quelques minutes",
              "4 propositions par génération",
              "Retouches en langage naturel",
              "Export HD (PNG, PDF print, JPEG)",
            ].map(b => (
              <div key={b} style={{ display: "flex", gap: 12, alignItems: "center", color: "#f4ecd8", fontSize: 14 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(244,236,216,0.15)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}><Icon name="check" size={12} stroke={2.5} /></span>
                {b}
              </div>
            ))}
          </div>
        </div>
      }
      right={
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h1 className="display" style={{ fontSize: 28, margin: 0, marginBottom: 8 }}>Créer mon compte</h1>
            <p style={{ fontSize: 14, color: "var(--ink-2)", margin: 0 }}>
              Déjà inscrit ? <a onClick={() => goto("login")} style={{ color: "var(--acc)", cursor: "pointer", fontWeight: 500 }}>Se connecter</a>
            </p>
          </div>

          <Button variant="outline" size="lg" full icon="google" onClick={signIn}>
            S'inscrire avec Google
          </Button>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--line-1)" }} />
            <span style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>OU</span>
            <div style={{ flex: 1, height: 1, background: "var(--line-1)" }} />
          </div>

          {/* Account type segmented */}
          <div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 6, display: "block" }}>
              Type de compte
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {ACCOUNT_TYPES.map(at => {
                const sel = form.accountType === at.value;
                return (
                  <button type="button" key={at.value} onClick={() => upd("accountType", at.value)}
                    style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "10px 8px",
                      background: sel ? "var(--acc-soft)" : "var(--bg-1)",
                      border: `1px solid ${sel ? "var(--acc-line)" : "var(--line-2)"}`,
                      borderRadius: 8, color: sel ? "var(--acc-bright)" : "var(--ink-1)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      fontFamily: "var(--font-sans)",
                    }}>
                    <Icon name={at.icon} size={14} />
                    {at.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Input label="Nom complet" icon="user" value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Amélie Bonnet" />
          {form.accountType !== "particulier" && (
            <Input label="Nom de l'entreprise" icon="folder" value={form.company} onChange={e => upd("company", e.target.value)} placeholder="Studio Rond" />
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
            <Input label="Email" icon="message" type="email" value={form.email} onChange={e => upd("email", e.target.value)} placeholder="vous@exemple.com" />
            <Input label="Téléphone" icon="bell" type="tel" value={form.phone} onChange={e => upd("phone", e.target.value)} placeholder="+33 6 ..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Input label="Mot de passe" icon="lock" type="password" value={form.password} onChange={e => upd("password", e.target.value)} placeholder="8 car. min." />
            <Input label="Confirmer" icon="lock" type="password" value={form.password2} onChange={e => upd("password2", e.target.value)}
              error={form.password2 && form.password2 !== form.password ? "Ne correspond pas" : null} />
          </div>

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
            <input type="checkbox" defaultChecked style={{ marginTop: 2, accentColor: "var(--acc)" }} />
            J'accepte les <a style={{ color: "var(--acc)" }}>conditions d'utilisation</a> et la <a style={{ color: "var(--acc)" }}>politique de confidentialité</a>.
          </label>

          <Button type="submit" size="lg" full icon="sparkles">Créer mon compte</Button>
        </form>
      }
    />
  );
}

window.ScreenLogin = ScreenLogin;
window.ScreenRegister = ScreenRegister;
