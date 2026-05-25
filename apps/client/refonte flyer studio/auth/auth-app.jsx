// auth/auth-app.jsx
// Shared auth pages: Login, Signup, Forgot, Verify (OTP), Reset, 2FA.
// Bilingual (FR/EN). Each HTML file sets window.__AUTH_PAGE before loading this.

// ────────────────────────────────────────────────────────────────────
// i18n
// ────────────────────────────────────────────────────────────────────
const AUTH_I18N = {
  fr: {
    brand: "Consilium Design",
    backHome: "Retour à l'accueil",
    legal: { copy: "© 2026 Consilium Design SAS", terms: "Mentions", privacy: "Confidentialité", help: "Aide" },
    or: "ou continuer avec",
    showPwd: "Afficher",
    hidePwd: "Masquer",
    rememberMe: "Garder ma session ouverte",
    needHelp: "Besoin d'aide ?",
    contact: "Nous contacter",

    login: {
      title: "Heureux de vous revoir.",
      subtitle: "Connectez-vous pour accéder à votre studio Consilium.",
      email: "Email",
      emailPh: "vous@entreprise.fr",
      pwd: "Mot de passe",
      pwdPh: "Votre mot de passe",
      forgot: "Mot de passe oublié ?",
      submit: "Se connecter",
      noAccount: "Pas encore de compte ?",
      signup: "Créer un compte",
      sso: { ms: "Microsoft", google: "Google", apple: "Apple" },
    },

    signup: {
      title: "Créez votre compte Consilium.",
      subtitle: "Gratuit pour démarrer. Pas de carte bancaire requise.",
      name: "Votre nom",
      namePh: "Camille Durand",
      email: "Email professionnel",
      emailPh: "camille@entreprise.fr",
      pwd: "Mot de passe",
      pwdPh: "Au moins 8 caractères",
      submit: "Créer mon compte",
      have: "Déjà un compte ?",
      signin: "Se connecter",
      terms: "En créant un compte, vous acceptez nos",
      termsLink: "conditions",
      and: "et notre",
      privacyLink: "politique de confidentialité",
      rules: {
        len: "Au moins 8 caractères",
        case: "Une majuscule et une minuscule",
        num: "Un chiffre",
        sym: "Un caractère spécial",
      },
    },

    forgot: {
      title: "Mot de passe oublié ?",
      subtitle: "Entrez votre email. Nous vous enverrons un lien sécurisé pour le réinitialiser.",
      email: "Email du compte",
      emailPh: "vous@entreprise.fr",
      submit: "Envoyer le lien",
      back: "Retour à la connexion",
      sent: "Email envoyé !",
      sentBody: "Si un compte existe pour cet email, vous recevrez un lien de réinitialisation dans quelques minutes.",
      sentHint: "Vérifiez aussi votre dossier spam.",
      resend: "Renvoyer l'email",
    },

    verify: {
      title: "Vérifiez votre email.",
      subtitle: "Nous avons envoyé un code à 6 chiffres à",
      change: "Changer d'email",
      submit: "Vérifier le code",
      resend: "Renvoyer le code",
      resendIn: "Renvoyer dans",
      didnt: "Vous n'avez rien reçu ?",
      success: "Email vérifié",
      successBody: "Votre compte est prêt. On vous emmène vers le studio…",
    },

    reset: {
      title: "Définissez un nouveau mot de passe.",
      subtitle: "Choisissez un mot de passe que vous n'avez pas utilisé ailleurs.",
      pwd: "Nouveau mot de passe",
      pwdPh: "Au moins 8 caractères",
      confirm: "Confirmer",
      confirmPh: "Tapez à nouveau",
      submit: "Enregistrer le mot de passe",
      success: "Mot de passe modifié",
      successBody: "Connectez-vous avec votre nouveau mot de passe.",
      backLogin: "Aller à la connexion",
      mismatch: "Les mots de passe ne correspondent pas",
    },

    tfa: {
      title: "Authentification en deux étapes",
      subtitle: "Pour sécuriser ce compte, entrez le code à 6 chiffres généré par votre application d'authentification.",
      submit: "Continuer",
      lost: "J'ai perdu mon appareil",
      lostHint: "Utilisez un code de récupération",
      useBackup: "Utiliser un code de secours",
      backupTitle: "Code de secours",
      backupSub: "Entrez l'un de vos codes à usage unique.",
      trust: "Faire confiance à cet appareil pendant 30 jours",
    },
  },

  en: {
    brand: "Consilium Design",
    backHome: "Back to home",
    legal: { copy: "© 2026 Consilium Design SAS", terms: "Terms", privacy: "Privacy", help: "Help" },
    or: "or continue with",
    showPwd: "Show",
    hidePwd: "Hide",
    rememberMe: "Keep me signed in",
    needHelp: "Need help?",
    contact: "Contact us",

    login: {
      title: "Welcome back.",
      subtitle: "Sign in to access your Consilium studio.",
      email: "Email",
      emailPh: "you@company.com",
      pwd: "Password",
      pwdPh: "Your password",
      forgot: "Forgot password?",
      submit: "Sign in",
      noAccount: "No account yet?",
      signup: "Create an account",
      sso: { ms: "Microsoft", google: "Google", apple: "Apple" },
    },

    signup: {
      title: "Create your Consilium account.",
      subtitle: "Free to get started. No credit card required.",
      name: "Your name",
      namePh: "Camille Durand",
      email: "Work email",
      emailPh: "camille@company.com",
      pwd: "Password",
      pwdPh: "At least 8 characters",
      submit: "Create my account",
      have: "Already have an account?",
      signin: "Sign in",
      terms: "By creating an account you agree to our",
      termsLink: "terms",
      and: "and",
      privacyLink: "privacy policy",
      rules: {
        len: "At least 8 characters",
        case: "An uppercase and a lowercase letter",
        num: "A number",
        sym: "A special character",
      },
    },

    forgot: {
      title: "Forgot your password?",
      subtitle: "Enter your email. We'll send you a secure link to reset it.",
      email: "Account email",
      emailPh: "you@company.com",
      submit: "Send the link",
      back: "Back to sign in",
      sent: "Email sent!",
      sentBody: "If an account exists for this email, you'll receive a reset link within a few minutes.",
      sentHint: "Check your spam folder too.",
      resend: "Resend the email",
    },

    verify: {
      title: "Check your email.",
      subtitle: "We sent a 6-digit code to",
      change: "Change email",
      submit: "Verify code",
      resend: "Resend code",
      resendIn: "Resend in",
      didnt: "Didn't get anything?",
      success: "Email verified",
      successBody: "Your account is ready. Heading to the studio…",
    },

    reset: {
      title: "Set a new password.",
      subtitle: "Pick a password you haven't used elsewhere.",
      pwd: "New password",
      pwdPh: "At least 8 characters",
      confirm: "Confirm",
      confirmPh: "Type again",
      submit: "Save password",
      success: "Password updated",
      successBody: "Sign in with your new password.",
      backLogin: "Go to sign in",
      mismatch: "Passwords don't match",
    },

    tfa: {
      title: "Two-step verification",
      subtitle: "To secure this account, enter the 6-digit code generated by your authenticator app.",
      submit: "Continue",
      lost: "Lost your device?",
      lostHint: "Use a recovery code",
      useBackup: "Use a backup code",
      backupTitle: "Backup code",
      backupSub: "Enter one of your single-use codes.",
      trust: "Trust this device for 30 days",
    },
  },
};

// ────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────
function useLang() {
  const [lang, setLang] = React.useState(() => {
    try { return localStorage.getItem("consilium-lang") || "fr"; } catch { return "fr"; }
  });
  React.useEffect(() => { try { localStorage.setItem("consilium-lang", lang); } catch {} }, [lang]);
  return [lang, setLang];
}

function LangToggle({ lang, setLang }) {
  return (
    <div style={{
      display: "inline-flex", height: 28, padding: 2,
      background: "var(--bg-elev-1)", borderRadius: 6, border: "1px solid var(--bd-soft-2)"
    }}>
      {["fr", "en"].map((L) => (
        <button key={L} onClick={() => setLang(L)} style={{
          width: 28, height: 24, fontSize: 11, fontWeight: 600,
          borderRadius: 4, border: 0, cursor: "pointer",
          background: lang === L ? "var(--accent)" : "transparent",
          color: lang === L ? "var(--accent-text-on)" : "var(--tx-secondary)",
          textTransform: "uppercase", letterSpacing: ".05em",
          fontFamily: "inherit",
        }}>{L}</button>
      ))}
    </div>
  );
}

// SSO logos (kept simple, monochrome)
function SsoLogos() {
  return {
    ms: (
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="9" height="9" fill="#F25022"/>
        <rect x="13" y="2" width="9" height="9" fill="#7FBA00"/>
        <rect x="2" y="13" width="9" height="9" fill="#00A4EF"/>
        <rect x="13" y="13" width="9" height="9" fill="#FFB900"/>
      </svg>
    ),
    google: (
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M22 12.2c0-.7-.06-1.4-.18-2.05H12v3.88h5.6c-.24 1.3-.97 2.4-2.07 3.14v2.6h3.34C20.83 18 22 15.36 22 12.2Z" fill="#4285F4"/>
        <path d="M12 22c2.8 0 5.15-.93 6.87-2.52l-3.34-2.6c-.93.62-2.11.99-3.53.99-2.71 0-5-1.83-5.82-4.29H2.74v2.7A10 10 0 0 0 12 22Z" fill="#34A853"/>
        <path d="M6.18 13.58A6 6 0 0 1 5.86 12c0-.55.1-1.08.27-1.58V7.72H2.74A10 10 0 0 0 2 12c0 1.62.39 3.16 1.08 4.52l3.1-2.94Z" fill="#FBBC05"/>
        <path d="M12 5.88c1.53 0 2.9.53 3.98 1.55l2.97-2.97C17.14 2.86 14.8 2 12 2A10 10 0 0 0 2.74 7.72L6.18 10.42C7 7.95 9.29 5.88 12 5.88Z" fill="#EA4335"/>
      </svg>
    ),
    apple: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.4 12.6c0-2.9 2.4-4.3 2.5-4.4-1.4-2-3.5-2.3-4.3-2.3-1.8-.2-3.6 1.1-4.5 1.1-.9 0-2.4-1.1-3.9-1.1-2 0-3.9 1.2-4.9 3-2.1 3.6-.5 9 1.5 12 1 1.4 2.2 3 3.8 2.9 1.5-.1 2.1-1 3.9-1 1.8 0 2.4 1 3.9 1 1.6 0 2.6-1.4 3.6-2.9.6-.9 1.1-1.9 1.5-3-2.4-.9-3-3.3-3.1-3.3Zm-3-7.7c.8-1 1.4-2.3 1.2-3.7-1.2.1-2.6.8-3.4 1.7-.7.9-1.4 2.3-1.2 3.6 1.4.1 2.7-.7 3.4-1.6Z"/>
      </svg>
    ),
  };
}

function SsoRow() {
  const logos = SsoLogos();
  return (
    <div className="auth-sso">
      <button className="auth-sso-btn" type="button" aria-label="Microsoft">{logos.ms}</button>
      <button className="auth-sso-btn" type="button" aria-label="Google">{logos.google}</button>
      <button className="auth-sso-btn" type="button" aria-label="Apple">{logos.apple}</button>
    </div>
  );
}

// Eye / EyeOff icons (used by password input)
const EyeIcon = ({ off, style }) => off ? (
  <svg viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10.6 6.1A10 10 0 0 1 12 6c5 0 9 4 10 6-.5 1-1.5 2.6-3 4M6.5 7.5C4 9.2 2.5 11.4 2 12c1 2 5 6 10 6 1.4 0 2.7-.3 4-.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M9.5 9.5a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
) : (
  <svg viewBox="0 0 24 24" fill="none" style={style}>
    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

function PasswordInput({ value, onChange, placeholder, autoFocus }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        type={show ? "text" : "password"}
        className="auth-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ paddingRight: 40 }}
      />
      <button type="button" className="auth-input-action" onClick={() => setShow((s) => !s)}>
        <EyeIcon off={show} style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}

// Password strength
function scorePassword(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^a-zA-Z\d]/.test(p)) s++;
  return s;
}
function passwordChecks(p) {
  return {
    len: p.length >= 8,
    case: /[a-z]/.test(p) && /[A-Z]/.test(p),
    num: /\d/.test(p),
    sym: /[^a-zA-Z\d]/.test(p),
  };
}

function PwdRules({ pwd, T }) {
  const checks = passwordChecks(pwd);
  const items = [
    { key: "len", label: T.rules.len },
    { key: "case", label: T.rules.case },
    { key: "num", label: T.rules.num },
    { key: "sym", label: T.rules.sym },
  ];
  const score = scorePassword(pwd);
  return (
    <>
      <div className="pwd-strength">
        {[1,2,3,4].map((i) => (
          <div key={i} className={`pwd-strength-seg ${score >= i ? `on-${score}` : ""}`} />
        ))}
      </div>
      <div className="pwd-rules">
        {items.map((it) => (
          <div key={it.key} className={`pwd-rule ${checks[it.key] ? "ok" : ""}`}>
            <span className="dot">
              {checks[it.key] ? (
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none">
                  <path d="m5 12 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : null}
            </span>
            {it.label}
          </div>
        ))}
      </div>
    </>
  );
}

// OTP boxes
function OtpInput({ length = 6, value, onChange, onComplete }) {
  const refs = React.useRef([]);
  const digits = Array.from({ length }).map((_, i) => value[i] || "");

  const setAt = (i, ch) => {
    const next = digits.slice();
    next[i] = ch;
    onChange(next.join(""));
  };

  const onInputChange = (i, e) => {
    const v = e.target.value.replace(/\D/g, "").slice(-1);
    setAt(i, v);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
    if (v && i === length - 1) {
      const full = digits.slice(0, i).join("") + v;
      if (full.length === length) onComplete?.(full);
    }
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace") {
      if (!digits[i] && i > 0) {
        setAt(i - 1, "");
        refs.current[i - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  };

  const onPaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text.padEnd(length, "").slice(0, length).replace(/ /g, ""));
    if (text.length === length) onComplete?.(text);
    const focusAt = Math.min(text.length, length - 1);
    refs.current[focusAt]?.focus();
  };

  return (
    <div className="otp-row" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`otp-box ${d ? "filled" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => onInputChange(i, e)}
          onKeyDown={(e) => onKey(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// Auth Shell — common chrome around each page
// ────────────────────────────────────────────────────────────────────
function AuthShell({ children, lang, setLang, wide }) {
  const t = AUTH_I18N[lang];
  return (
    <div className="auth-page">
      <div className="auth-top">
        <a href="../Consilium Design.html" className="brand">
          <BrandMark size={30} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>{t.brand}</span>
        </a>
        <div className="top-right">
          <a href="../Consilium Design.html" className="btn-ghost" style={{
            padding: "6px 12px", borderRadius: 6, fontSize: 13,
            color: "var(--tx-secondary)", display: "inline-flex", alignItems: "center", gap: 6
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t.backHome}
          </a>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>

      <div className="auth-body">
        <div className={`auth-card ${wide ? "wide" : ""}`}>
          {children}
        </div>
      </div>

      <div className="auth-legal">
        <div>{t.legal.copy}</div>
        <div className="auth-legal-links">
          <a href="#">{t.legal.terms}</a>
          <a href="#">{t.legal.privacy}</a>
          <a href="#">{t.legal.help}</a>
        </div>
      </div>
    </div>
  );
}

function PageHeading({ icon, title, subtitle }) {
  return (
    <div className="auth-brand-row">
      {icon && (
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "var(--accent-soft)", color: "var(--accent)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(76,194,255,.2)",
        }}>
          {icon}
        </div>
      )}
      <div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <div className="auth-subtitle">{subtitle}</div>}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ────────────────────────────────────────────────────────────────────
function LoginPage({ lang, setLang }) {
  const t = AUTH_I18N[lang].login;
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd] = React.useState("");
  const [remember, setRemember] = React.useState(true);

  return (
    <AuthShell lang={lang} setLang={setLang}>
      <PageHeading
        icon={<Ico.user style={{ width: 24, height: 24 }} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SsoRow />

      <div className="auth-divider">{AUTH_I18N[lang].or.replace("ou continuer avec", "ou avec votre email")
        .replace("or continue with", "or with your email")}</div>

      <form onSubmit={(e) => { e.preventDefault(); alert("Demo — auth backend non branché."); }}>
        <div className="auth-field">
          <label className="auth-field-lbl">{t.email}</label>
          <div className="auth-input-wrap">
            <Ico.mail className="auth-input-icon" />
            <input className="auth-input" type="email" placeholder={t.emailPh}
                   value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="auth-field">
          <div className="auth-field-row">
            <label className="auth-field-lbl">{t.pwd}</label>
            <a href="./Forgot password.html" className="auth-link">{t.forgot}</a>
          </div>
          <PasswordInput value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={t.pwdPh} />
        </div>

        <label className="auth-check" style={{ marginTop: 6, marginBottom: 18 }}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="box" />
          {AUTH_I18N[lang].rememberMe}
        </label>

        <button type="submit" className="auth-btn">
          {t.submit}
          <Ico.arrow style={{ width: 16, height: 16 }} />
        </button>
      </form>

      <div className="auth-foot">
        {t.noAccount} <a href="./Signup.html">{t.signup}</a>
      </div>
    </AuthShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// SIGNUP PAGE
// ────────────────────────────────────────────────────────────────────
function SignupPage({ lang, setLang }) {
  const t = AUTH_I18N[lang].signup;
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [pwd, setPwd] = React.useState("");

  const score = scorePassword(pwd);
  const canSubmit = name && email && score >= 3;

  return (
    <AuthShell lang={lang} setLang={setLang}>
      <PageHeading
        icon={<Ico.sparkle style={{ width: 24, height: 24 }} />}
        title={t.title}
        subtitle={t.subtitle}
      />

      <SsoRow />
      <div className="auth-divider">{AUTH_I18N[lang].or.replace("continuer avec", "avec email").replace("continue with", "with email")}</div>

      <form onSubmit={(e) => { e.preventDefault(); window.location.href = "./Verify email.html"; }}>
        <div className="auth-field">
          <label className="auth-field-lbl">{t.name}</label>
          <div className="auth-input-wrap">
            <Ico.user className="auth-input-icon" />
            <input className="auth-input" placeholder={t.namePh}
                   value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field-lbl">{t.email}</label>
          <div className="auth-input-wrap">
            <Ico.mail className="auth-input-icon" />
            <input className="auth-input" type="email" placeholder={t.emailPh}
                   value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field-lbl">{t.pwd}</label>
          <PasswordInput value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={t.pwdPh} />
          {pwd && <PwdRules pwd={pwd} T={t} />}
        </div>

        <p style={{ fontSize: 12, color: "var(--tx-tertiary)", margin: "14px 0 18px", lineHeight: 1.5 }}>
          {t.terms} <a href="#" className="auth-link">{t.termsLink}</a> {t.and}{" "}
          <a href="#" className="auth-link">{t.privacyLink}</a>.
        </p>

        <button type="submit" className="auth-btn" disabled={!canSubmit}>
          {t.submit}
          <Ico.arrow style={{ width: 16, height: 16 }} />
        </button>
      </form>

      <div className="auth-foot">
        {t.have} <a href="./Login.html">{t.signin}</a>
      </div>
    </AuthShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD PAGE
// ────────────────────────────────────────────────────────────────────
function ForgotPage({ lang, setLang }) {
  const t = AUTH_I18N[lang].forgot;
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);

  return (
    <AuthShell lang={lang} setLang={setLang}>
      {!sent ? (
        <>
          <PageHeading
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6"/>
                <circle cx="12" cy="15.5" r="1.2" fill="currentColor"/>
              </svg>
            }
            title={t.title}
            subtitle={t.subtitle}
          />

          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="auth-field">
              <label className="auth-field-lbl">{t.email}</label>
              <div className="auth-input-wrap">
                <Ico.mail className="auth-input-icon" />
                <input className="auth-input" type="email" placeholder={t.emailPh}
                       value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={!email}>
              {t.submit}
              <Ico.arrow style={{ width: 16, height: 16 }} />
            </button>
          </form>

          <div className="auth-foot">
            <a href="./Login.html">← {t.back}</a>
          </div>
        </>
      ) : (
        <>
          <PageHeading
            icon={<Ico.mail style={{ width: 24, height: 24 }} />}
            title={t.sent}
            subtitle={t.sentBody}
          />
          <div className="auth-banner info" style={{ marginTop: 8 }}>
            <span className="icon-bubble"><Ico.info style={{ width: 12, height: 12 }} /></span>
            <span>{t.sentHint}</span>
          </div>
          <button onClick={() => setSent(false)} className="auth-btn-secondary" style={{ marginTop: 8 }}>
            {t.resend}
          </button>
          <div className="auth-foot">
            <a href="./Login.html">← {t.back}</a>
          </div>
        </>
      )}
    </AuthShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// VERIFY EMAIL (OTP)
// ────────────────────────────────────────────────────────────────────
function VerifyPage({ lang, setLang }) {
  const t = AUTH_I18N[lang].verify;
  const [code, setCode] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [seconds, setSeconds] = React.useState(45);
  const target = "camille@entreprise.fr";

  React.useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  return (
    <AuthShell lang={lang} setLang={setLang}>
      {!done ? (
        <>
          <PageHeading
            icon={<Ico.mail style={{ width: 24, height: 24 }} />}
            title={t.title}
            subtitle={
              <>
                {t.subtitle} <strong style={{ color: "var(--tx-primary)" }}>{target}</strong>
                <div style={{ marginTop: 6 }}>
                  <a href="./Signup.html" className="auth-link">{t.change}</a>
                </div>
              </>
            }
          />

          <form onSubmit={(e) => { e.preventDefault(); setDone(true); setTimeout(() => {
            window.location.href = "../Consilium Design.html";
          }, 1800); }}>
            <OtpInput
              length={6}
              value={code}
              onChange={setCode}
              onComplete={() => { /* could auto-submit */ }}
            />
            <button type="submit" className="auth-btn" disabled={code.length < 6}>
              {t.submit}
              <Ico.arrow style={{ width: 16, height: 16 }} />
            </button>
          </form>

          <div className="auth-foot" style={{ marginTop: 22 }}>
            {t.didnt}{" "}
            {seconds > 0 ? (
              <span style={{ color: "var(--tx-tertiary)" }}>
                {t.resendIn} {seconds}s
              </span>
            ) : (
              <a href="#" onClick={(e) => { e.preventDefault(); setSeconds(45); }}>{t.resend}</a>
            )}
          </div>
        </>
      ) : (
        <>
          <PageHeading
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title={t.success}
            subtitle={t.successBody}
          />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
            <div className="loading-spinner" />
          </div>
        </>
      )}
    </AuthShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ────────────────────────────────────────────────────────────────────
function ResetPage({ lang, setLang }) {
  const t = AUTH_I18N[lang].reset;
  const tSignup = AUTH_I18N[lang].signup;
  const [pwd, setPwd] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [done, setDone] = React.useState(false);

  const score = scorePassword(pwd);
  const mismatch = confirm && confirm !== pwd;
  const canSubmit = score >= 3 && pwd === confirm;

  return (
    <AuthShell lang={lang} setLang={setLang}>
      {!done ? (
        <>
          <PageHeading
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6"/>
                <path d="m10 16 1.5 1.5L15 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title={t.title}
            subtitle={t.subtitle}
          />

          <form onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
            <div className="auth-field">
              <label className="auth-field-lbl">{t.pwd}</label>
              <PasswordInput value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={t.pwdPh} autoFocus />
              {pwd && <PwdRules pwd={pwd} T={tSignup} />}
            </div>

            <div className="auth-field">
              <label className="auth-field-lbl">{t.confirm}</label>
              <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t.confirmPh} />
              {mismatch && (
                <div style={{ fontSize: 12, color: "#ff9d9d", marginTop: 4 }}>{t.mismatch}</div>
              )}
            </div>

            <button type="submit" className="auth-btn" disabled={!canSubmit} style={{ marginTop: 8 }}>
              {t.submit}
              <Ico.arrow style={{ width: 16, height: 16 }} />
            </button>
          </form>
        </>
      ) : (
        <>
          <PageHeading
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path d="m5 12 5 5L20 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            title={t.success}
            subtitle={t.successBody}
          />
          <a href="./Login.html" className="auth-btn" style={{ textDecoration: "none", marginTop: 8 }}>
            {t.backLogin}
            <Ico.arrow style={{ width: 16, height: 16 }} />
          </a>
        </>
      )}
    </AuthShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// TWO-FACTOR
// ────────────────────────────────────────────────────────────────────
function TwoFactorPage({ lang, setLang }) {
  const t = AUTH_I18N[lang].tfa;
  const [code, setCode] = React.useState("");
  const [trust, setTrust] = React.useState(false);
  const [backup, setBackup] = React.useState(false);
  const [backupCode, setBackupCode] = React.useState("");

  return (
    <AuthShell lang={lang} setLang={setLang}>
      <PageHeading
        icon={<Ico.shield style={{ width: 24, height: 24 }} />}
        title={backup ? t.backupTitle : t.title}
        subtitle={backup ? t.backupSub : t.subtitle}
      />

      {!backup ? (
        <form onSubmit={(e) => { e.preventDefault(); window.location.href = "../Consilium Design.html"; }}>
          <OtpInput length={6} value={code} onChange={setCode} />

          <label className="auth-check" style={{ margin: "0 0 16px" }}>
            <input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} />
            <span className="box" />
            {t.trust}
          </label>

          <button type="submit" className="auth-btn" disabled={code.length < 6}>
            {t.submit}
            <Ico.arrow style={{ width: 16, height: 16 }} />
          </button>

          <div className="auth-foot" style={{ marginTop: 22 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setBackup(true); }}>{t.useBackup}</a>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); window.location.href = "../Consilium Design.html"; }}>
          <div className="auth-field">
            <label className="auth-field-lbl">{t.backupTitle}</label>
            <input className="auth-input" placeholder="XXXX-XXXX-XXXX"
                   value={backupCode} onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                   style={{ letterSpacing: ".15em", fontFamily: "var(--font-mono)" }}
                   autoFocus />
          </div>

          <button type="submit" className="auth-btn" disabled={backupCode.length < 10}>
            {t.submit}
          </button>

          <div className="auth-foot" style={{ marginTop: 22 }}>
            <a href="#" onClick={(e) => { e.preventDefault(); setBackup(false); }}>← Code authenticator</a>
          </div>
        </form>
      )}
    </AuthShell>
  );
}

// ────────────────────────────────────────────────────────────────────
// ROUTER
// ────────────────────────────────────────────────────────────────────
function AuthApp() {
  const [lang, setLang] = useLang();
  const page = window.__AUTH_PAGE || "login";
  const pages = {
    login: LoginPage,
    signup: SignupPage,
    forgot: ForgotPage,
    verify: VerifyPage,
    reset: ResetPage,
    tfa: TwoFactorPage,
  };
  const Page = pages[page] || LoginPage;
  return <Page lang={lang} setLang={setLang} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(<AuthApp />);
