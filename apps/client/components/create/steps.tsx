"use client"

import type { Dispatch, SetStateAction } from "react"
import { Card } from "@/components/ui/Card"
import { Input, Textarea } from "@/components/ui/Input"
import { Badge } from "@/components/ui/Badge"
import { Icon } from "@/components/ui/Icon"
import { cn } from "@/lib/utils"
import { VISUAL_TYPES, VISUAL_STYLES, VISUAL_FORMATS, PRECISION_LEVELS, OBJECTIVES, type WizardForm } from "./wizard-data"

interface StepProps {
  form: WizardForm
  setForm: Dispatch<SetStateAction<WizardForm>>
}

const upd = (setForm: Dispatch<SetStateAction<WizardForm>>) => <K extends keyof WizardForm>(k: K, v: WizardForm[K]) =>
  setForm((f) => ({ ...f, [k]: v }))

// ─── Step 1: Type ───────────────────────────────────────────────────────────
export function StepType({ form, setForm }: StepProps) {
  const set = upd(setForm)
  return (
    <div>
      <StepHeader title="Quel type de visuel souhaitez-vous créer ?" subtitle="Choisissez le format adapté à votre besoin." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 24 }}>
        {VISUAL_TYPES.map((t) => {
          const active = form.type === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => set("type", t.value)}
              style={{
                display: "flex", flexDirection: "column", gap: 8, padding: 16,
                background: active ? "var(--acc-soft)" : "var(--bg-1)",
                border: `1px solid ${active ? "var(--acc-line)" : "var(--line-1)"}`,
                borderRadius: 12, cursor: "pointer", textAlign: "left",
                color: active ? "var(--ink-0)" : "var(--ink-1)",
                transition: "all 150ms",
              }}
            >
              <span
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: active ? "var(--acc)" : "var(--bg-3)",
                  color: active ? "var(--acc-ink)" : "var(--acc)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name={t.icon} size={16} />
              </span>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{t.desc}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Informations ───────────────────────────────────────────────────
export function StepInfos({ form, setForm }: StepProps) {
  const set = upd(setForm)
  return (
    <div>
      <StepHeader title="Donnez vie à votre brief." subtitle="Plus le brief est précis, plus le résultat est juste." />
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Titre de l'événement / produit" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Soirée After Work" required />
          <Input label="Marque / entreprise" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="EVENTLAB" required />
        </div>
        <Textarea label="Description complète" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Soirée After Work du vendredi 12 mai. Ambiance chaleureuse, bar à cocktails, DJ set jusqu'à 1h." />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Message principal" value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Soirée After Work" />
          <Input label="Sous-titre / accroche" value={form.secondary} onChange={(e) => set("secondary", e.target.value)} placeholder="Vendredi 12 Mai · Le Loft" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <Input label="Contact" value={form.contact} onChange={(e) => set("contact", e.target.value)} icon="message" placeholder="rsvp@…" />
          <Input label="Date" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} icon="calendar" placeholder="12/05/2025" />
          <Input label="Audience" value={form.audience} onChange={(e) => set("audience", e.target.value)} icon="user" placeholder="CSP+, 28-45 ans" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 8 }}>Objectif principal</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {OBJECTIVES.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => set("objective", o)}
                style={{
                  padding: "6px 12px", fontSize: 13, fontWeight: 500,
                  background: form.objective === o ? "var(--acc-soft)" : "var(--bg-1)",
                  color: form.objective === o ? "var(--acc-bright)" : "var(--ink-1)",
                  border: `1px solid ${form.objective === o ? "var(--acc-line)" : "var(--line-2)"}`,
                  borderRadius: 8, cursor: "pointer",
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Style ──────────────────────────────────────────────────────────
export function StepStyle({ form, setForm }: StepProps) {
  const set = upd(setForm)
  function toggle(v: string) {
    set("style", form.style.includes(v) ? form.style.filter((s) => s !== v) : [...form.style, v])
  }
  return (
    <div>
      <StepHeader title="Quel style donnez-vous au visuel ?" subtitle="Sélectionnez plusieurs styles si vous voulez les mélanger." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10, marginTop: 24 }}>
        {VISUAL_STYLES.map((s) => {
          const active = form.style.includes(s.value)
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => toggle(s.value)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 12, padding: 14,
                background: active ? "var(--acc-soft)" : "var(--bg-1)",
                border: `1px solid ${active ? "var(--acc-line)" : "var(--line-1)"}`,
                borderRadius: 10, cursor: "pointer", textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: active ? "var(--ink-0)" : "var(--ink-1)" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{s.desc}</div>
              </div>
              <span
                style={{
                  width: 18, height: 18, borderRadius: 4,
                  background: active ? "var(--acc)" : "transparent",
                  border: `1px solid ${active ? "var(--acc)" : "var(--line-3)"}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {active && <Icon name="check" size={11} stroke={3} style={{ color: "var(--acc-ink)" }} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 4: Colors ─────────────────────────────────────────────────────────
export function StepColors({ form, setForm }: StepProps) {
  const set = upd(setForm)
  function addColor(field: "colorsPref" | "colorsAvoid") {
    set(field, [...form[field], "#c66a45"])
  }
  function setColor(field: "colorsPref" | "colorsAvoid", i: number, v: string) {
    const next = [...form[field]]
    next[i] = v
    set(field, next)
  }
  function removeColor(field: "colorsPref" | "colorsAvoid", i: number) {
    set(field, form[field].filter((_, j) => j !== i))
  }

  return (
    <div>
      <StepHeader title="Quelles sont vos préférences couleurs ?" subtitle="Glissez les couleurs préférées et celles à éviter." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
        {(["colorsPref", "colorsAvoid"] as const).map((field) => (
          <div key={field}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 10 }}>
              {field === "colorsPref" ? "Couleurs préférées" : "Couleurs à éviter"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {form[field].map((c, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <input
                    type="color"
                    value={c}
                    onChange={(e) => setColor(field, i, e.target.value)}
                    style={{
                      width: 56, height: 56, padding: 0, border: "1px solid var(--line-2)",
                      borderRadius: 10, background: "transparent", cursor: "pointer",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(field, i)}
                    style={{
                      position: "absolute", top: -6, right: -6, width: 20, height: 20,
                      borderRadius: "50%", background: "var(--bg-3)", border: "1px solid var(--line-2)",
                      color: "var(--ink-2)", cursor: "pointer", fontSize: 12,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addColor(field)}
                style={{
                  width: 56, height: 56, borderRadius: 10,
                  border: "1px dashed var(--line-3)", background: "var(--bg-1)",
                  color: "var(--ink-3)", cursor: "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 5: Format ─────────────────────────────────────────────────────────
export function StepFormat({ form, setForm }: StepProps) {
  const set = upd(setForm)
  return (
    <div>
      <StepHeader title="Choisissez le format final." subtitle="Vous pouvez préciser des dimensions sur-mesure." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginTop: 24 }}>
        {VISUAL_FORMATS.map((f) => {
          const active = form.format === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => set("format", f.value)}
              style={{
                display: "flex", flexDirection: "column", gap: 8, padding: 16,
                background: active ? "var(--acc-soft)" : "var(--bg-1)",
                border: `1px solid ${active ? "var(--acc-line)" : "var(--line-1)"}`,
                borderRadius: 12, cursor: "pointer", textAlign: "left",
              }}
            >
              <Icon name={f.icon} size={18} style={{ color: active ? "var(--acc)" : "var(--ink-2)" }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{f.size}</div>
            </button>
          )
        })}
      </div>
      {form.format === "custom" && (
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Largeur (px)" type="number" value={form.customW} onChange={(e) => set("customW", Number(e.target.value))} />
          <Input label="Hauteur (px)" type="number" value={form.customH} onChange={(e) => set("customH", Number(e.target.value))} />
        </div>
      )}
    </div>
  )
}

// ─── Step 6: Precision ──────────────────────────────────────────────────────
export function StepPrecision({ form, setForm }: StepProps) {
  const set = upd(setForm)
  return (
    <div>
      <StepHeader title="Quel niveau de liberté pour l'IA ?" subtitle="Plus c'est strict, moins l'IA s'écarte de vos consignes." />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        {PRECISION_LEVELS.map((p) => {
          const active = form.precision === p.value
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => set("precision", p.value)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 16, padding: 18,
                background: active ? "var(--acc-soft)" : "var(--bg-1)",
                border: `1px solid ${active ? "var(--acc-line)" : "var(--line-1)"}`,
                borderRadius: 12, cursor: "pointer", textAlign: "left",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: active ? "var(--ink-0)" : "var(--ink-1)" }}>{p.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{p.desc}</div>
              </div>
              <span
                style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: active ? "var(--acc)" : "transparent",
                  border: `2px solid ${active ? "var(--acc)" : "var(--line-3)"}`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {active && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--acc-ink)" }} />}
              </span>
            </button>
          )
        })}
      </div>
      <div style={{ marginTop: 24 }}>
        <Textarea label="Notes complémentaires (optionnel)" rows={3} value={form.extraNotes} onChange={(e) => set("extraNotes", e.target.value)} placeholder="Précisions, références, contraintes…" />
      </div>
    </div>
  )
}

// ─── Step 7: Summary ────────────────────────────────────────────────────────
export function StepSummary({ form }: { form: WizardForm }) {
  const type = VISUAL_TYPES.find((t) => t.value === form.type)
  const fmt = VISUAL_FORMATS.find((f) => f.value === form.format)
  const prec = PRECISION_LEVELS.find((p) => p.value === form.precision)

  return (
    <div>
      <StepHeader title="Récapitulatif du brief." subtitle="Vérifiez les informations avant de lancer la génération." />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <SumRow label="Type">{type?.label ?? form.type}</SumRow>
        <SumRow label="Titre">{form.title || <em style={{ color: "var(--ink-3)" }}>—</em>}</SumRow>
        <SumRow label="Marque">{form.brand || <em style={{ color: "var(--ink-3)" }}>—</em>}</SumRow>
        <SumRow label="Description">{form.description || <em style={{ color: "var(--ink-3)" }}>—</em>}</SumRow>
        <SumRow label="Objectif"><Badge tone="acc" size="sm">{form.objective}</Badge></SumRow>
        <SumRow label="Style">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {form.style.map((s) => {
              const v = VISUAL_STYLES.find((x) => x.value === s)
              return <Badge key={s} size="sm">{v?.label ?? s}</Badge>
            })}
          </div>
        </SumRow>
        <SumRow label="Couleurs préférées">
          <div style={{ display: "flex", gap: 6 }}>
            {form.colorsPref.map((c, i) => (
              <span key={i} style={{ width: 24, height: 24, background: c, borderRadius: 6, border: "1px solid var(--line-2)" }} />
            ))}
          </div>
        </SumRow>
        <SumRow label="Format">{fmt?.label} · <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>{fmt?.size}</span></SumRow>
        <SumRow label="Précision">{prec?.label}</SumRow>
      </div>
    </div>
  )
}

function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2 className="display" style={{ fontSize: 26, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 6 }}>{subtitle}</p>}
    </div>
  )
}

function SumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, padding: "14px 16px", background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 8 }}>
      <div style={{ fontSize: 12, color: "var(--ink-2)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 14, color: "var(--ink-0)" }}>{children}</div>
    </div>
  )
}
