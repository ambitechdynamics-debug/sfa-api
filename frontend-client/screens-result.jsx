// screens-result.jsx — Generation result + retouch flow + canvas overview

const GENERATION_PHASES = [
  { id: "queued",     label: "En file d'attente", t: 600 },
  { id: "imagining",  label: "Composition",       t: 1300 },
  { id: "rendering",  label: "Rendu haute déf.",  t: 1700 },
  { id: "polishing",  label: "Finitions",         t: 1100 },
  { id: "ready",      label: "Prêt",              t: 0 },
];

function ScreenResult() {
  const { goto } = useNav();
  const { draft, setProjects, setToast } = useApp();
  const [phaseIdx, setPhaseIdx] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const [selectedVariant, setSelectedVariant] = React.useState(0);
  const [retouchOpen, setRetouchOpen] = React.useState(false);
  const [retouchText, setRetouchText] = React.useState("");
  const [retouching, setRetouching] = React.useState(false);
  const [versions, setVersions] = React.useState([
    { id: "v1", label: "v1 · Génération initiale", at: "il y a 2 min", note: "4 propositions générées", current: true },
  ]);

  const ready = phaseIdx >= GENERATION_PHASES.length - 1;

  // Sim progress
  React.useEffect(() => {
    if (ready) return;
    const phase = GENERATION_PHASES[phaseIdx];
    const start = Date.now();
    let raf;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / phase.t);
      setProgress(p);
      if (p >= 1) {
        setPhaseIdx(i => Math.min(i + 1, GENERATION_PHASES.length - 1));
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phaseIdx]);

  React.useEffect(() => {
    if (ready) setToast({ msg: "4 propositions générées · 1 crédit utilisé", tone: "sage", icon: "check" });
  }, [ready]);

  const variants = [
    { kind: "editorial", label: "Variante A · Éditorial", brief: { title: "Soirée\nAfter Work", date: "VEN 12.05", venue: "Le Loft · Paris 10", brand: "EVENTLAB" } },
    { kind: "menu",      label: "Variante B · Sombre",   brief: { title: "After\nWork", price: "12.05", brand: "EVENTLAB" } },
    { kind: "launch",    label: "Variante C · Vibrant",  brief: { title: "After\nWork '25", subtitle: "Vendredi 12 Mai", brand: "EVENTLAB" } },
    { kind: "corp",      label: "Variante D · Sobre",    brief: { title: "After\nWork", date: "12.05.25", brand: "EVENTLAB" } },
  ];

  const submitRetouch = () => {
    if (!retouchText.trim()) return;
    setRetouching(true);
    setTimeout(() => {
      setRetouching(false);
      setRetouchOpen(false);
      setVersions(vs => [
        { id: "v" + (vs.length + 1), label: `v${vs.length + 1} · Retouche`, at: "à l'instant", note: retouchText.slice(0, 60), current: true },
        ...vs.map(v => ({ ...v, current: false })),
      ]);
      setRetouchText("");
      setToast({ msg: "Retouche appliquée", tone: "acc", icon: "wand" });
    }, 1800);
  };

  const validate = () => {
    setToast({ msg: "Visuel validé · ajouté à votre bibliothèque", tone: "sage", icon: "check" });
    goto("history");
  };

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <Breadcrumb items={[{ label: "Tableau de bord", to: "dashboard" }, { label: "Création" }, { label: draft?.title || "Soirée After Work" }]} />
          <h1 className="display" style={{ fontSize: 28, margin: "8px 0 0", letterSpacing: "-0.02em" }}>
            {draft?.title || "Soirée After Work — Mai"}
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>
            4 propositions · format {(draft?.format || "1080") === "1080" ? "1080×1080" : draft?.format} · style {(draft?.style || []).map(s => VISUAL_STYLES.find(x => x.value === s)?.label).filter(Boolean).join(", ") || "Élégant, Événementiel"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" icon="refresh" onClick={() => { setPhaseIdx(0); setProgress(0); }}>Régénérer</Button>
          <Button variant="outline" icon="download">Exporter</Button>
          <Button icon="check" onClick={validate} disabled={!ready}>Valider</Button>
        </div>
      </div>

      {/* Generation status banner */}
      {!ready && <GenerationStatus phase={GENERATION_PHASES[phaseIdx]} phaseIdx={phaseIdx} progress={progress} />}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 24, alignItems: "flex-start" }}>
        {/* Left: variants */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {variants.map((v, i) => (
              <VariantCard
                key={i}
                v={v}
                idx={i}
                ready={ready}
                progress={ready ? 1 : progress}
                phase={GENERATION_PHASES[phaseIdx].id}
                selected={selectedVariant === i}
                onSelect={() => setSelectedVariant(i)}
              />
            ))}
          </div>

          {/* Action toolbar (selected variant) */}
          {ready && (
            <Card padding={20} style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Badge tone="acc" icon="image">Variante {String.fromCharCode(65 + selectedVariant)}</Badge>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Variante sélectionnée</div>
                  <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Téléchargez, demandez une retouche ou validez.</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" icon="wand" onClick={() => setRetouchOpen(true)}>Retoucher</Button>
                <Button variant="outline" icon="download">Télécharger HD</Button>
                <Button icon="check" onClick={validate}>Valider</Button>
              </div>
            </Card>
          )}

          {/* Inline retouch panel */}
          {retouchOpen && (
            <Card padding={22} style={{ marginTop: 16, borderColor: "var(--acc-line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--acc-soft)", color: "var(--acc-bright)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="wand" size={15} />
                  </span>
                  <div>
                    <div style={{ fontWeight: 500 }}>Demander une retouche</div>
                    <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Décrivez ce que vous voulez modifier — l'IA produira une nouvelle version.</div>
                  </div>
                </div>
                <button onClick={() => setRetouchOpen(false)} style={{ background: "transparent", border: 0, color: "var(--ink-3)", cursor: "pointer", padding: 6 }}>
                  <Icon name="x" size={16} />
                </button>
              </div>

              {/* Quick actions */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                {["Plus grand titre", "Couleurs plus chaudes", "Ajouter un QR code", "Espacement plus généreux", "Police plus moderne", "Logo plus discret"].map(t => (
                  <button key={t} onClick={() => setRetouchText(rt => rt + (rt ? ". " : "") + t)} style={{
                    padding: "5px 10px", background: "var(--bg-2)",
                    border: "1px solid var(--line-2)", borderRadius: 999,
                    color: "var(--ink-1)", fontSize: 12, cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                  }}>+ {t}</button>
                ))}
              </div>

              <Textarea rows={3} value={retouchText} onChange={e => setRetouchText(e.target.value)} placeholder="Ex : Augmenter la taille du titre, et utiliser un dégradé orange/rouge pour le fond. Garder le logo en bas à droite." />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <Button variant="ghost" onClick={() => setRetouchOpen(false)}>Annuler</Button>
                <Button icon={retouching ? null : "sparkles"} onClick={submitRetouch} disabled={retouching || !retouchText.trim()}>
                  {retouching ? "Application…" : "Appliquer la retouche"}
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Right: panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 90 }}>
          {/* Prompt */}
          <Card padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Prompt généré
              </span>
              <Button size="sm" variant="ghost" icon="copy">Copier</Button>
            </div>
            <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--ink-1)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
{`Affiche événementielle pour soirée After Work professionnelle, style éditorial moderne. Palette terracotta sur crème. Composition centrée, typographie display imposante. Mention de la date et du lieu en pied. Logo de la marque en haut à gauche. Format carré 1080×1080.`}
            </pre>
          </Card>

          {/* Versions timeline */}
          <Card padding={18}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Historique des versions</span>
              <Badge size="sm" tone="neutral">{versions.length}</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {versions.map((v, i) => (
                <div key={v.id} style={{ display: "flex", gap: 12, position: "relative", paddingBottom: i < versions.length - 1 ? 14 : 0 }}>
                  {/* dot+line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: v.current ? "var(--acc)" : "var(--bg-3)",
                      border: v.current ? "2px solid var(--acc-bright)" : "1px solid var(--line-2)",
                      boxShadow: v.current ? "0 0 0 4px var(--acc-soft)" : "none",
                      marginTop: 4,
                    }} />
                    {i < versions.length - 1 && (
                      <span style={{ flex: 1, width: 1, background: "var(--line-2)", marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-0)" }}>{v.label}</span>
                      <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{v.at}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {v.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Memory ref */}
          <Card padding={18}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="brain" size={14} style={{ color: "var(--acc)" }} />
              Mémoire IA appliquée
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55 }}>
              Cette génération s'appuie sur votre <strong>charte EVENTLAB v1</strong> · 3 visuels précédents · ton « élégant, urbain ».
            </div>
            <Button size="sm" variant="ghost" icon="settings" style={{ marginTop: 10 }}>Gérer mes mémoires</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Generation status bar
function GenerationStatus({ phase, phaseIdx, progress }) {
  const total = GENERATION_PHASES.length - 1; // exclude 'ready'
  const overall = Math.min(1, (phaseIdx + progress) / total);
  return (
    <Card padding={20} style={{ marginBottom: 16, borderColor: "var(--acc-line)", background: "var(--acc-soft)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--acc)", color: "var(--acc-ink)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            animation: "spin 1.5s linear infinite",
          }}><Icon name="sparkles" size={15} /></span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-0)" }}>
              Génération en cours · {phase.label}…
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>
              4 propositions construites en parallèle · environ 8 secondes
            </div>
          </div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--acc-bright)", fontWeight: 600 }}>
          {Math.round(overall * 100)}%
        </div>
      </div>
      <div style={{ height: 4, background: "rgba(0,0,0,0.15)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{
          width: `${overall * 100}%`, height: "100%",
          background: "linear-gradient(90deg, var(--acc), var(--acc-bright))",
          transition: "width 200ms",
        }} />
      </div>
    </Card>
  );
}

// Variant card
function VariantCard({ v, idx, ready, progress, phase, selected, onSelect }) {
  const Mock = ready ? POSTER_MOCKS[v.kind] : null;
  return (
    <button onClick={onSelect} style={{
      textAlign: "left", padding: 12, background: "var(--bg-1)",
      border: `1px solid ${selected ? "var(--acc-line)" : "var(--line-1)"}`,
      borderRadius: 14, cursor: "pointer", display: "flex", flexDirection: "column", gap: 10,
      boxShadow: selected ? "0 0 0 3px var(--acc-soft)" : "var(--sh-1)",
      transition: "border-color 150ms, box-shadow 150ms",
      fontFamily: "var(--font-sans)", color: "var(--ink-0)",
    }}>
      {ready && Mock ? (
        <Mock {...v.brief} />
      ) : (
        <PosterSkeleton phase={phase} progress={progress} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 4px" }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{v.label}</span>
        {selected && ready && <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--acc)" }} />}
        {!selected && ready && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>Cliquer pour sélectionner</span>}
      </div>
    </button>
  );
}

const POSTER_MOCKS = {
  editorial: PosterEditorial,
  menu:      PosterMenu,
  launch:    PosterLaunch,
  sale:      PosterSale,
  corp:      PosterCorp,
  music:     PosterMusic,
};

// Breadcrumb
function Breadcrumb({ items }) {
  const { goto } = useNav();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-3)" }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <Icon name="chevR" size={11} />}
          {it.to ? (
            <button onClick={() => goto(it.to)} style={{ background: "transparent", border: 0, color: "var(--ink-2)", cursor: "pointer", padding: 0, fontSize: 12 }}>{it.label}</button>
          ) : (
            <span style={{ color: i === items.length - 1 ? "var(--ink-1)" : "var(--ink-3)" }}>{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

window.ScreenResult = ScreenResult;
window.Breadcrumb = Breadcrumb;
window.POSTER_MOCKS = POSTER_MOCKS;
