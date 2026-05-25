// app.jsx — main App composition + tweaks + lang state

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "lang": "fr",
  "intensity": "balanced",
  "accent": "#4cc2ff",
  "taskbar": true
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = ["#4cc2ff", "#9b6cff", "#34d399", "#ff9d4a"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const lang = t.lang || "fr";
  const setLang = (L) => setTweak("lang", L);

  // expose lang globally for sub-components that don't take it as prop (template mocks, etc.)
  React.useEffect(() => { window.__lang = lang; }, [lang]);
  window.__lang = lang;

  // Apply accent dynamically
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", t.accent);
    // derived
    const hex = t.accent.replace("#", "");
    const r = parseInt(hex.slice(0,2), 16);
    const g = parseInt(hex.slice(2,4), 16);
    const b = parseInt(hex.slice(4,6), 16);
    root.style.setProperty("--accent-soft", `rgba(${r},${g},${b},.14)`);
    root.style.setProperty("--accent-glow", `rgba(${r},${g},${b},.35)`);
    // pick black on light accents, white on dark
    const lum = (0.299*r + 0.587*g + 0.114*b) / 255;
    root.style.setProperty("--accent-text-on", lum > 0.5 ? "#0a0a0a" : "#ffffff");
    // hover slightly lighter
    root.style.setProperty("--accent-hover",
      `rgb(${Math.min(255, r+20)},${Math.min(255, g+20)},${Math.min(255, b+20)})`);
  }, [t.accent]);

  const content = window.CONTENT[lang];

  return (
    <div className={`intensity-${t.intensity}`}>
      <TopNav t={content} lang={lang} setLang={setLang} intensity={t.intensity} />
      <Hero t={content} lang={lang} intensity={t.intensity} />
      <LogosBand t={content} />
      <Pillars t={content} />
      <Templates t={content} lang={lang} />
      <UseCases t={content} lang={lang} />
      <HowItWorks t={content} />
      <Pricing t={content} lang={lang} />
      <Reviews t={content} />
      <Contact t={content} lang={lang} />
      <Footer t={content} lang={lang} setLang={setLang} taskbar={t.taskbar} />

      <TweaksPanel title="Tweaks">
        <TweakSection label={lang === "fr" ? "Apparence" : "Appearance"} />
        <TweakRadio
          label={lang === "fr" ? "Intensité Windows" : "Windows intensity"}
          value={t.intensity}
          options={["subtle", "balanced", "full"]}
          onChange={(v) => setTweak("intensity", v)}
        />
        <TweakColor
          label={lang === "fr" ? "Accent" : "Accent"}
          value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak("accent", v)}
        />
        <TweakToggle
          label={lang === "fr" ? "Barre des tâches (footer)" : "Taskbar (footer)"}
          value={t.taskbar}
          onChange={(v) => setTweak("taskbar", v)}
        />

        <TweakSection label={lang === "fr" ? "Langue" : "Language"} />
        <TweakRadio
          label={lang === "fr" ? "Langue" : "Language"}
          value={lang}
          options={["fr", "en"]}
          onChange={(v) => setTweak("lang", v)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
