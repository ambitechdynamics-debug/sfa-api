// screens-create.jsx — 7-step create wizard

const WIZARD_STEPS = [
  { id: 1, label: "Type",        icon: "layers" },
  { id: 2, label: "Informations", icon: "type" },
  { id: 3, label: "Style",       icon: "brush" },
  { id: 4, label: "Couleurs",    icon: "palette" },
  { id: 5, label: "Format",      icon: "layout" },
  { id: 6, label: "Précision",   icon: "wand" },
  { id: 7, label: "Résumé",      icon: "check" },
];

function ScreenCreate() {
  const { goto } = useNav();
  const { setDraft, setToast } = useApp();
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    type: "event",
    title: "Soirée After Work",
    brand: "EVENTLAB",
    description: "Soirée After Work du vendredi 12 mai. Ambiance chaleureuse, bar à cocktails, DJ set jusqu'à 1h.",
    message: "Soirée After Work",
    secondary: "Vendredi 12 Mai · Le Loft · Paris 10",
    contact: "rsvp@eventlab.fr",
    eventDate: "12/05/2025",
    audience: "CSP+, 28-45 ans, urbains",
    objective: "Inviter",
    style: ["elegant", "evenementiel"],
    colorsPref: ["#c66a45", "#1a0e08", "#f4ecd8"],
    colorsAvoid: [],
    logo: null,
    images: [],
    strict: "no",
    format: "1080",
    customW: 1080,
    customH: 1080,
    precision: "guided",
    extraNotes: "",
  });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const next = () => setStep(s => Math.min(7, s + 1));
  const prev = () => setStep(s => Math.max(1, s - 1));
  const submit = () => {
    setDraft(form);
    setToast({ msg: "Génération lancée — 4 propositions en cours…", tone: "acc", icon: "sparkles" });
    goto("result");
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px minmax(0, 1fr) 320px", gap: 24 }}>
      {/* Stepper */}
      <div>
        <Stepper steps={WIZARD_STEPS} current={step} onJump={setStep} />
      </div>

      {/* Form */}
      <div>
        <Card padding={32} style={{ minHeight: 540 }}>
          <div key={step} className="anim-fade-up">
            {step === 1 && <StepType form={form} upd={upd} />}
            {step === 2 && <StepInfos form={form} upd={upd} />}
            {step === 3 && <StepStyle form={form} upd={upd} />}
            {step === 4 && <StepColors form={form} upd={upd} />}
            {step === 5 && <StepFormat form={form} upd={upd} />}
            {step === 6 && <StepPrecision form={form} upd={upd} />}
            {step === 7 && <StepSummary form={form} />}
          </div>

          {/* Footer nav */}
          <div style={{
            marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line-1)",
            display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
          }}>
            <Button variant="ghost" icon="arrowL" onClick={prev} disabled={step === 1}>Précédent</Button>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="outline" icon="bookmark" onClick={() => setToast({ msg: "Brouillon sauvegardé", tone: "sage" })}>
                Sauvegarder en brouillon
              </Button>
              {step < 7 ? (
                <Button iconRight="arrowR" onClick={next}>Suivant</Button>
              ) : (
                <Button icon="sparkles" size="lg" onClick={submit}>Envoyer à l'IA</Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Live preview / context */}
      <div style={{ position: "sticky", top: 90, alignSelf: "start" }}>
        <LivePreview form={form} />
      </div>
    </div>
  );
}

// Vertical stepper
function Stepper({ steps, current, onJump }) {
  return (
    <div style={{
      padding: 20, background: "var(--bg-1)", border: "1px solid var(--line-1)",
      borderRadius: 14, position: "sticky", top: 90,
    }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", marginBottom: 16, textTransform: "uppercase" }}>
        Brief · Étape {current}/{steps.length}
      </div>
      <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ width: `${(current / steps.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--acc-bright), var(--acc-deep))", transition: "width 280ms" }} />
      </div>
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        {steps.map(s => {
          const done = s.id < current;
          const active = s.id === current;
          return (
            <li key={s.id}>
              <button onClick={() => onJump(s.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "8px 10px", textAlign: "left",
                background: active ? "var(--bg-3)" : "transparent",
                border: 0, borderRadius: 8, cursor: "pointer",
                color: active ? "var(--ink-0)" : done ? "var(--ink-1)" : "var(--ink-3)",
                fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)",
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: "50%",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: active ? "var(--acc)" : done ? "var(--acc-soft)" : "var(--bg-3)",
                  color: active ? "var(--acc-ink)" : done ? "var(--acc-bright)" : "var(--ink-3)",
                  border: active ? 0 : `1px solid ${done ? "var(--acc-line)" : "var(--line-2)"}`,
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>
                  {done ? <Icon name="check" size={11} stroke={2.5} /> : s.id}
                </span>
                <span>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StepHeader({ overline, title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--acc)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{overline}</div>
      <h2 className="display" style={{ fontSize: 26, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      {subtitle && <p style={{ marginTop: 8, fontSize: 14, color: "var(--ink-2)", maxWidth: 540, lineHeight: 1.55 }}>{subtitle}</p>}
    </div>
  );
}

// Step 1
function StepType({ form, upd }) {
  return (
    <>
      <StepHeader overline="Étape 1" title="Quel type de visuel ?" subtitle="Choisissez le support principal. L'IA adaptera ensuite la composition aux conventions de ce format." />
      <OptionGrid value={form.type} onChange={v => upd("type", v)} options={VISUAL_TYPES} columns={3} />
    </>
  );
}

// Step 2
function StepInfos({ form, upd }) {
  return (
    <>
      <StepHeader overline="Étape 2" title="Les informations du projet" subtitle="Plus le brief est précis, meilleurs sont les visuels. Mentionnez le contexte, l'émotion, le public." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Titre du visuel" value={form.title} onChange={e => upd("title", e.target.value)} placeholder="Soirée After Work" />
          <Input label="Marque ou entreprise" value={form.brand} onChange={e => upd("brand", e.target.value)} placeholder="EVENTLAB" />
        </div>
        <Textarea label="Description du besoin" value={form.description} onChange={e => upd("description", e.target.value)} rows={3} placeholder="Décrivez en quelques phrases l'événement, le ton souhaité, le contexte…" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Message principal à afficher" value={form.message} onChange={e => upd("message", e.target.value)} hint="Ce qui sera lu en premier" />
          <Input label="Texte secondaire" value={form.secondary} onChange={e => upd("secondary", e.target.value)} hint="Date, lieu, sous-titre…" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Input label="Contact à afficher" icon="message" value={form.contact} onChange={e => upd("contact", e.target.value)} placeholder="email@..." />
          <Input label="Date / lieu" icon="calendar" value={form.eventDate} onChange={e => upd("eventDate", e.target.value)} placeholder="12/05/2025" />
          <Input label="Public cible" icon="user" value={form.audience} onChange={e => upd("audience", e.target.value)} placeholder="CSP+, 28-45 ans" />
        </div>

        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 8, display: "block" }}>
            Objectif du visuel
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {OBJECTIVES.map(o => {
              const sel = form.objective === o;
              return (
                <button key={o} onClick={() => upd("objective", o)} style={{
                  padding: "6px 12px",
                  background: sel ? "var(--acc-soft)" : "var(--bg-1)",
                  border: `1px solid ${sel ? "var(--acc-line)" : "var(--line-2)"}`,
                  borderRadius: 999,
                  color: sel ? "var(--acc-bright)" : "var(--ink-1)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}>{o}</button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// Step 3
function StepStyle({ form, upd }) {
  const opts = VISUAL_STYLES.map(s => ({ ...s }));
  return (
    <>
      <StepHeader overline="Étape 3" title="Quelle direction artistique ?" subtitle="Sélectionnez 1 à 3 styles. L'IA combinera ces influences pour proposer 4 variantes." />
      <OptionGrid value={form.style} onChange={v => upd("style", v)} options={opts} columns={3} multi />
    </>
  );
}

// Step 4
function StepColors({ form, upd }) {
  const swatchPalettes = [
    ["#c66a45", "#1a0e08", "#f4ecd8"],
    ["#5d7a4d", "#1a0e08", "#f4ecd8"],
    ["#8861a3", "#1a0e08", "#f4ecd8"],
    ["#4d7da8", "#1a0e08", "#f4ecd8"],
    ["#a8803a", "#1a0e08", "#f4ecd8"],
    ["#1a0e08", "#c66a45", "#fff"],
  ];
  return (
    <>
      <StepHeader overline="Étape 4" title="Couleurs et identité" subtitle="Importez votre logo, choisissez votre palette. L'IA respectera votre charte graphique." />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Palettes */}
        <div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 10, display: "block" }}>
            Palettes suggérées
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {swatchPalettes.map((p, i) => {
              const sel = JSON.stringify(form.colorsPref) === JSON.stringify(p);
              return (
                <button key={i} onClick={() => upd("colorsPref", p)} style={{
                  padding: 10, background: sel ? "var(--acc-soft)" : "var(--bg-1)",
                  border: `1px solid ${sel ? "var(--acc-line)" : "var(--line-2)"}`,
                  borderRadius: 10, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
                }}>
                  <div style={{ display: "flex", height: 40, borderRadius: 6, overflow: "hidden" }}>
                    {p.map((c, j) => <div key={j} style={{ flex: 1, background: c }} />)}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-2)", fontFamily: "var(--font-mono)", textAlign: "left" }}>
                    {p.map(c => c.toUpperCase()).join(" · ")}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom color picks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <ColorListPicker label="Couleurs préférées" colors={form.colorsPref} onChange={v => upd("colorsPref", v)} accent="acc" />
          <ColorListPicker label="Couleurs à éviter"  colors={form.colorsAvoid} onChange={v => upd("colorsAvoid", v)} accent="rose" />
        </div>

        {/* Uploads */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <UploadSlot label="Logo de la marque" hint="PNG, SVG · max 5 Mo · fond transparent recommandé" />
          <UploadSlot label="Images de référence" hint="JPG, PNG · jusqu'à 5 fichiers" multi />
        </div>

        {/* Strict charter */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          padding: "14px 16px", background: "var(--bg-1)", border: "1px solid var(--line-1)",
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Icon name="lock" size={16} style={{ color: "var(--acc)", marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Respect strict de la charte graphique</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>L'IA n'utilisera <em>que</em> votre palette et votre logo, sans variation.</div>
            </div>
          </div>
          <Switch value={form.strict === "yes"} onChange={v => upd("strict", v ? "yes" : "no")} />
        </div>
      </div>
    </>
  );
}

function ColorListPicker({ label, colors, onChange, accent }) {
  return (
    <div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 8, display: "block" }}>{label}</span>
      <div style={{
        padding: 10, background: "var(--bg-1)", border: "1px solid var(--line-2)",
        borderRadius: 10, display: "flex", flexWrap: "wrap", gap: 6, minHeight: 56,
      }}>
        {colors.map((c, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 4px 4px 8px",
            background: "var(--bg-2)", border: "1px solid var(--line-2)",
            borderRadius: 999, fontSize: 12, color: "var(--ink-1)",
            fontFamily: "var(--font-mono)",
          }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: c, border: "1px solid var(--line-2)" }} />
            {c.toUpperCase()}
            <button onClick={() => onChange(colors.filter((_, j) => j !== i))} style={{
              width: 16, height: 16, borderRadius: "50%", background: "var(--bg-3)",
              color: "var(--ink-2)", border: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><Icon name="x" size={9} stroke={2.5} /></button>
          </span>
        ))}
        <button onClick={() => {
          const next = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
          onChange([...colors, next]);
        }} style={{
          padding: "4px 10px", background: "transparent",
          border: "1px dashed var(--line-3)", borderRadius: 999,
          color: "var(--ink-2)", fontSize: 12, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          <Icon name="plus" size={11} /> ajouter
        </button>
      </div>
    </div>
  );
}

function UploadSlot({ label, hint, multi }) {
  const [files, setFiles] = React.useState([]);
  return (
    <div>
      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 8, display: "block" }}>{label}</span>
      <div onClick={() => setFiles([...files, "fichier_" + (files.length + 1) + ".png"])} style={{
        padding: "20px 16px", background: "var(--bg-1)",
        border: "1px dashed var(--line-3)", borderRadius: 10,
        cursor: "pointer", display: "flex", flexDirection: "column", gap: 8,
        alignItems: "center", justifyContent: "center", textAlign: "center",
        minHeight: 100, transition: "border-color 150ms",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--acc-line)"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line-3)"}
      >
        {files.length === 0 ? (
          <>
            <Icon name="upload" size={18} style={{ color: "var(--ink-2)" }} />
            <div style={{ fontSize: 13, color: "var(--ink-1)" }}>Cliquez ou déposez {multi ? "vos fichiers" : "votre fichier"}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{hint}</div>
          </>
        ) : (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%" }}>
            {files.map((f, i) => (
              <Badge key={i} tone="acc" icon="image">{f}</Badge>
            ))}
            <Badge tone="neutral" icon="plus">ajouter</Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function Switch({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 38, height: 22, borderRadius: 11,
      background: value ? "var(--acc)" : "var(--bg-3)",
      border: 0, padding: 2, cursor: "pointer",
      display: "inline-flex", alignItems: "center",
      transition: "background 200ms",
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: "50%",
        background: "#f4ecd8", boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
        transform: value ? "translateX(16px)" : "translateX(0)",
        transition: "transform 200ms",
      }} />
    </button>
  );
}

// Step 5 — Format
function StepFormat({ form, upd }) {
  return (
    <>
      <StepHeader overline="Étape 5" title="Quel format ?" subtitle="L'IA optimisera la composition pour les proportions choisies." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {VISUAL_FORMATS.map(f => {
          const sel = form.format === f.value;
          return (
            <button key={f.value} onClick={() => upd("format", f.value)} style={{
              padding: 18, textAlign: "left",
              background: sel ? "var(--acc-soft)" : "var(--bg-1)",
              border: `1px solid ${sel ? "var(--acc-line)" : "var(--line-2)"}`,
              borderRadius: 12, cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 14,
              fontFamily: "var(--font-sans)", color: "var(--ink-0)",
              boxShadow: sel ? "0 0 0 3px var(--acc-soft)" : "var(--sh-1)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: sel ? "var(--acc)" : "var(--bg-3)",
                  color: sel ? "var(--acc-ink)" : "var(--ink-1)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}><Icon name={f.icon} size={16} /></span>
                {sel && <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--acc)" }} />}
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 80 }}>
                <div style={{
                  background: "var(--bg-3)", border: "1px solid var(--line-3)",
                  aspectRatio: f.ratio, height: f.value === "banner" ? 36 : 70,
                  borderRadius: 4,
                }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{f.label}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{f.size}</div>
              </div>
            </button>
          );
        })}
      </div>
      {form.format === "custom" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Largeur (px)" type="number" value={form.customW} onChange={e => upd("customW", e.target.value)} suffix="px" />
          <Input label="Hauteur (px)" type="number" value={form.customH} onChange={e => upd("customH", e.target.value)} suffix="px" />
        </div>
      )}
    </>
  );
}

// Step 6 — Precision
function StepPrecision({ form, upd }) {
  return (
    <>
      <StepHeader overline="Étape 6" title="Niveau de précision" subtitle="Plus l'IA est libre, plus les propositions sont créatives. Plus elle est cadrée, plus elles collent au brief." />
      <OptionGrid value={form.precision} onChange={v => upd("precision", v)} options={PRECISION_LEVELS.map(p => ({ ...p, icon: p.value === "free" ? "sparkles" : p.value === "guided" ? "wand" : p.value === "strict" ? "lock" : "image" }))} columns={2} />
      <div style={{ marginTop: 20 }}>
        <Textarea label="Instructions complémentaires (optionnel)" rows={3} value={form.extraNotes} onChange={e => upd("extraNotes", e.target.value)} placeholder="Ex : ne pas utiliser de personnages, garder un espace vide en bas pour mes coordonnées…" />
      </div>
    </>
  );
}

// Step 7 — Summary
function StepSummary({ form }) {
  const styleLabels = (form.style || []).map(s => VISUAL_STYLES.find(v => v.value === s)?.label).filter(Boolean).join(", ");
  const fmt = VISUAL_FORMATS.find(f => f.value === form.format);
  const prec = PRECISION_LEVELS.find(p => p.value === form.precision);
  const type = VISUAL_TYPES.find(t => t.value === form.type);

  const rows = [
    { label: "Type",     value: type?.label, icon: type?.icon },
    { label: "Marque",   value: form.brand, icon: "folder" },
    { label: "Message",  value: form.message },
    { label: "Texte secondaire", value: form.secondary },
    { label: "Public cible", value: form.audience, icon: "user" },
    { label: "Objectif", value: form.objective, icon: "tag" },
    { label: "Style",    value: styleLabels, icon: "brush" },
    { label: "Format",   value: `${fmt?.label} · ${fmt?.size}`, icon: "layout" },
    { label: "Précision", value: prec?.label, icon: "wand" },
  ];

  return (
    <>
      <StepHeader overline="Étape 7" title="Récapitulatif avant génération" subtitle="Vérifiez les informations. L'IA va générer 4 propositions à partir de ce brief." />

      {/* Generated prompt preview */}
      <div style={{
        padding: 16, background: "var(--bg-1)", border: "1px solid var(--line-1)",
        borderRadius: 10, marginBottom: 20,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Prompt IA généré
          </span>
          <Button size="sm" variant="ghost" icon="copy">Copier</Button>
        </div>
        <pre style={{
          margin: 0, fontFamily: "var(--font-mono)", fontSize: 12,
          color: "var(--ink-1)", lineHeight: 1.6, whiteSpace: "pre-wrap",
        }}>
{`{
  "type": "${form.type}",
  "brand": "${form.brand}",
  "message": "${form.message}",
  "audience": "${form.audience}",
  "objective": "${form.objective}",
  "styles": ${JSON.stringify(form.style)},
  "palette": ${JSON.stringify(form.colorsPref)},
  "format": "${form.format}",
  "precision": "${form.precision}",
  "memoryRefs": ["brand:${form.brand}/v1"]
}`}
        </pre>
      </div>

      <div style={{
        background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 10,
        overflow: "hidden",
      }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: "grid", gridTemplateColumns: "180px 1fr", gap: 16,
            padding: "12px 16px",
            borderTop: i > 0 ? "1px solid var(--line-1)" : 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {r.icon && <Icon name={r.icon} size={12} />}
              {r.label}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-0)", lineHeight: 1.5 }}>{r.value || "—"}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 16, padding: "12px 14px",
        background: "var(--acc-soft)", border: "1px solid var(--acc-line)",
        borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start",
        fontSize: 13, color: "var(--ink-1)", lineHeight: 1.5,
      }}>
        <Icon name="zap" size={16} style={{ color: "var(--acc-bright)", flexShrink: 0, marginTop: 1 }} />
        <div>
          Cette génération consommera <strong>1 crédit IA</strong>. Il vous restera <strong>{MOCK_USER.credits - 1} crédits</strong> ce mois-ci.
        </div>
      </div>
    </>
  );
}

// Live preview sidebar
function LivePreview({ form }) {
  const fmt = VISUAL_FORMATS.find(f => f.value === form.format);
  const styleLabels = (form.style || []).map(s => VISUAL_STYLES.find(v => v.value === s)?.label).filter(Boolean);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
          Aperçu live
        </div>
        <PosterEditorial
          title={form.message || "Votre titre"}
          date={form.eventDate || "Date"}
          venue={form.secondary || "Sous-titre"}
          brand={form.brand || "MARQUE"}
          ratio={fmt?.ratio || "1/1"}
        />
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink-3)", textAlign: "center", fontFamily: "var(--font-mono)" }}>
          aperçu approximatif · {fmt?.size}
        </div>
      </Card>

      <Card padding={16}>
        <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 10, fontWeight: 500 }}>Brief en cours</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
          <Row k="Type"   v={VISUAL_TYPES.find(t => t.value === form.type)?.label} />
          <Row k="Marque" v={form.brand} />
          <Row k="Style"  v={styleLabels.length ? styleLabels.join(", ") : "—"} />
          <Row k="Format" v={fmt?.label} />
          <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6 }}>
            <span style={{ color: "var(--ink-3)" }}>Palette</span>
            <span style={{ display: "flex", gap: 3 }}>
              {(form.colorsPref || []).slice(0, 4).map(c => (
                <span key={c} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: "1px solid var(--line-2)" }} />
              ))}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: "var(--ink-3)" }}>{k}</span>
      <span style={{ color: "var(--ink-1)", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{v || "—"}</span>
    </div>
  );
}

window.ScreenCreate = ScreenCreate;
