"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { Icon } from "@/components/ui/Icon"
import { Input } from "@/components/ui/Input"
import { ChatInput, PageContainer, PromptChip } from "@/components/app/dashboard-ui"
import { Poster } from "@/components/poster/Poster"
import { createProject, createTravail, generateFinalPrompt, upsertTravailMemory } from "@/lib/projects"
import { trackEvent } from "@/lib/ux-metrics"
import { ApiError } from "@/lib/api"

const TYPES = [
  { value: "event", label: "Événement", icon: "calendar" },
  { value: "promo", label: "Promotion", icon: "tag" },
  { value: "menu", label: "Menu", icon: "layout" },
  { value: "launch", label: "Lancement", icon: "rocket" },
]

const FORMATS = ["Instagram 1:1", "Story 9:16", "A4 print", "Flyer A5", "Banner web"]
const SUGGESTIONS = [
  "Rends le visuel plus premium et minimaliste",
  "Ajoute un appel à l'action clair",
  "Propose une version plus festive",
  "Prépare une déclinaison pour story Instagram",
]

export default function DashboardCreatePage() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [type, setType] = useState(TYPES[0].value)
  const [format, setFormat] = useState(FORMATS[0])
  const [brand, setBrand] = useState("")
  const [tone, setTone] = useState("Premium, clair, moderne")
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Décrivez l'affiche à produire. Je prépare le brief, les options et le projet en un seul flux." },
  ])

  useEffect(() => {
    trackEvent("create_page_opened")
    const params = new URLSearchParams(window.location.search)
    const initialPrompt = params.get("prompt")
    if (initialPrompt) setPrompt(initialPrompt)
  }, [])

  const selectedType = useMemo(() => TYPES.find((item) => item.value === type) ?? TYPES[0], [type])

  async function submitPrompt() {
    const clean = prompt.trim()
    if (!clean) return
    setSubmitting(true)
    setHistory((items) => [...items, { role: "user", text: clean }, { role: "assistant", text: "Je structure le brief et lance la génération du projet." }])
    trackEvent("prompt_submitted", { promptLength: clean.length, type, format })
    trackEvent("generation_started", { type, format })

    try {
      const title = clean.split(/[.!?]/)[0].slice(0, 72) || "Nouvelle création"
      // Modèle Project = marque container, Travail = livrable. On crée les deux d'un coup.
      const project = await createProject({ title: brand || title })
      const travail = await createTravail(project.id, {
        title,
        posterType: selectedType.label,
        category: "AI_PROMPT",
        format,
        style: tone,
      })

      await Promise.allSettled([
        upsertTravailMemory(travail.id, "M-SMS", { description: clean, message: clean, secondary: "" }),
        upsertTravailMemory(travail.id, "M-MD", { type, format, audience: "Client final", objective: "Créer une affiche prête à publier", eventDate: "" }),
        upsertTravailMemory(travail.id, "M-CONTACT", { brand, contact: "" }),
        upsertTravailMemory(travail.id, "M-STYLE", { styles: [tone], precision: "Rapide", notes: "Création via dashboard conversationnel" }),
      ])

      try {
        await generateFinalPrompt(travail.id)
      } catch {
        trackEvent("final_prompt_generation_failed", { travailId: travail.id })
      }

      trackEvent("generation_completed", { travailId: travail.id, type, format })
      toast.success("Création lancée")
      router.push(`/dashboard/t/${travail.id}`)
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Génération impossible"
      trackEvent("generation_failed", { message: msg, type, format })
      toast.error(msg)
      setHistory((items) => [...items, { role: "assistant", text: "La génération a échoué. Vérifiez vos crédits ou réessayez avec un brief plus court." }])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageContainer width={1180}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 330px", gap: 20 }} className="max-lg:!grid-cols-1">
        <section style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding={0} style={{ overflow: "hidden", minHeight: 500 }}>
            <div style={{ padding: 18, borderBottom: "1px solid var(--line-1)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <Badge tone="acc" icon="sparkles">Création IA</Badge>
                <h2 className="display" style={{ fontSize: 26, margin: "10px 0 0", letterSpacing: 0 }}>Prompt vers affiche</h2>
              </div>
              <Badge tone="sage" icon="bookmark">Sauvegarde automatique</Badge>
            </div>

            <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
              {history.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  style={{
                    alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "min(680px, 92%)",
                    padding: "12px 14px",
                    borderRadius: item.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    background: item.role === "user" ? "var(--acc-soft)" : "var(--bg-1)",
                    border: `1px solid ${item.role === "user" ? "var(--acc-line)" : "var(--line-1)"}`,
                    color: "var(--ink-1)",
                    fontSize: 14,
                    lineHeight: 1.55,
                  }}
                >
                  {item.text}
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SUGGESTIONS.map((suggestion) => (
              <PromptChip key={suggestion} onClick={() => setPrompt((value) => value ? `${value}. ${suggestion}` : suggestion)}>{suggestion}</PromptChip>
            ))}
          </div>

          <ChatInput value={prompt} onChange={setPrompt} onSubmit={submitPrompt} disabled={submitting} placeholder="Ex. Affiche premium pour l'ouverture d'un restaurant, ambiance chaude, texte principal..." />
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card padding={16}>
            <Poster kind="editorial" brief={{ title: prompt ? prompt.split(" ").slice(0, 4).join("\n") : "Votre\nAffiche\nIA", brand: brand || "POSTER AI" }} ratio="3/4" />
          </Card>

          <Card padding={18}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700 }}>Type de création</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {TYPES.map((item) => {
                const active = item.value === type
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setType(item.value)}
                    style={{
                      padding: 10,
                      borderRadius: 10,
                      border: active ? "1px solid var(--acc-line)" : "1px solid var(--line-1)",
                      background: active ? "var(--acc-soft)" : "var(--bg-1)",
                      color: active ? "var(--acc-bright)" : "var(--ink-1)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    <Icon name={item.icon} size={14} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </Card>

          <Card padding={18}>
            <button
              type="button"
              onClick={() => setAdvancedOpen((value) => !value)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "transparent", border: 0, color: "var(--ink-0)", cursor: "pointer", padding: 0 }}
            >
              <span style={{ fontSize: 14, fontWeight: 700 }}>Options simples</span>
              <Icon name={advancedOpen ? "chevronU" : "chevronD"} size={14} />
            </button>
            {advancedOpen && (
              <div className="anim-fade-up" style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 600 }}>Format</span>
                  <select value={format} onChange={(event) => setFormat(event.target.value)} style={{ height: 38, background: "var(--bg-1)", color: "var(--ink-0)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 10px" }}>
                    {FORMATS.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <Input label="Marque" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Nom de marque" icon="tag" />
                <Input label="Direction visuelle" value={tone} onChange={(event) => setTone(event.target.value)} icon="palette" />
              </div>
            )}
          </Card>
        </aside>
      </div>
    </PageContainer>
  )
}
