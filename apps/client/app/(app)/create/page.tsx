"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Stepper } from "@/components/create/Stepper"
import { LivePreview } from "@/components/create/LivePreview"
import { StepType, StepInfos, StepStyle, StepColors, StepFormat, StepPrecision, StepSummary } from "@/components/create/steps"
import { WIZARD_STEPS, INITIAL_FORM, VISUAL_TYPES } from "@/components/create/wizard-data"
import { createProject, upsertProjectMemory, generateFinalPrompt } from "@/lib/projects"
import { ApiError } from "@/lib/api"

export default function CreatePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)

  async function saveDraft(silent = false) {
    setSavingDraft(true)
    try {
      const visualType = VISUAL_TYPES.find((t) => t.value === form.type)
      const project = await createProject({
        title: form.title || "Brouillon",
        posterType: visualType?.label ?? form.type,
        category: form.objective,
        format: form.format,
        style: form.style.join(","),
      })

      // Persist all wizard memory entries (best-effort, don't block on failure)
      await Promise.allSettled([
        upsertProjectMemory(project.id, "M-SMS",       { description: form.description, message: form.message, secondary: form.secondary }),
        upsertProjectMemory(project.id, "M-MD",        { type: form.type, format: form.format, audience: form.audience, objective: form.objective, eventDate: form.eventDate }),
        upsertProjectMemory(project.id, "M-COULEURS", { preferred: form.colorsPref, avoid: form.colorsAvoid }),
        upsertProjectMemory(project.id, "M-CONTACT",  { contact: form.contact, brand: form.brand }),
        upsertProjectMemory(project.id, "M-STYLE",    { styles: form.style, precision: form.precision, notes: form.extraNotes }),
      ])

      if (!silent) toast.success("Brouillon sauvegardé")
      return project
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erreur de sauvegarde"
      toast.error(msg)
      return null
    } finally {
      setSavingDraft(false)
    }
  }

  async function submit() {
    setSubmitting(true)
    try {
      const project = await saveDraft(true)
      if (!project) return
      try {
        await generateFinalPrompt(project.id)
      } catch (err) {
        // Generation may fail silently in mock backends — we still send the user to the result page
        console.warn("generate-final-prompt failed", err)
      }
      toast.success("Génération lancée — 4 propositions en cours…")
      router.push(`/projects/${project.id}/result`)
    } finally {
      setSubmitting(false)
    }
  }

  const next = () => setStep((s) => Math.min(7, s + 1))
  const prev = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px minmax(0, 1fr) 320px", gap: 24, maxWidth: 1400 }} className="max-md:!grid-cols-1">
      {/* Stepper */}
      <Stepper steps={WIZARD_STEPS} current={step} onJump={setStep} />

      {/* Form */}
      <div>
        <Card padding={32} style={{ minHeight: 520 }}>
          <div key={step} className="anim-fade-up">
            {step === 1 && <StepType form={form} setForm={setForm} />}
            {step === 2 && <StepInfos form={form} setForm={setForm} />}
            {step === 3 && <StepStyle form={form} setForm={setForm} />}
            {step === 4 && <StepColors form={form} setForm={setForm} />}
            {step === 5 && <StepFormat form={form} setForm={setForm} />}
            {step === 6 && <StepPrecision form={form} setForm={setForm} />}
            {step === 7 && <StepSummary form={form} />}
          </div>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--line-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <Button variant="ghost" icon="arrowL" onClick={prev} disabled={step === 1}>Précédent</Button>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="outline" icon="bookmark" onClick={() => saveDraft()} disabled={savingDraft}>
                {savingDraft ? "Sauvegarde…" : "Sauvegarder en brouillon"}
              </Button>
              {step < 7 ? (
                <Button iconRight="arrowR" onClick={next}>Suivant</Button>
              ) : (
                <Button icon="sparkles" size="lg" onClick={submit} disabled={submitting}>
                  {submitting ? "Envoi en cours…" : "Envoyer à l'IA"}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Live preview */}
      <div className="max-md:hidden">
        <LivePreview form={form} />
      </div>
    </div>
  )
}
