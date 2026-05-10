"use client"

import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Poster, type PosterKind } from "@/components/poster/Poster"
import type { WizardForm } from "./wizard-data"
import { VISUAL_TYPES, VISUAL_FORMATS } from "./wizard-data"

function pickKind(type: string): PosterKind {
  if (type === "menu") return "menu"
  if (type === "story") return "launch"
  if (type === "logo" || type === "couv") return "corp"
  if (type === "event") return "music"
  if (type === "post-fb" || type === "banniere") return "corp"
  return "editorial"
}

export function LivePreview({ form }: { form: WizardForm }) {
  const kind = pickKind(form.type)
  const fmt = VISUAL_FORMATS.find((f) => f.value === form.format)
  const ratio = fmt?.ratio ?? "1/1"
  const type = VISUAL_TYPES.find((t) => t.value === form.type)

  const brief = {
    title: form.title || "Votre\nVisuel",
    brand: form.brand || "MARQUE",
    date: form.eventDate || form.message,
    venue: form.secondary,
    artist: form.brand,
    subtitle: form.secondary,
    price: form.message,
  }

  return (
    <Card padding={20}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--acc)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Aperçu live
        </span>
        <Badge size="sm" tone="acc" dot>Maquette</Badge>
      </div>
      <Poster kind={kind} brief={brief} ratio={ratio} />
      <div style={{ marginTop: 12, fontSize: 11, color: "var(--ink-3)", textAlign: "center" }}>
        {type?.label}{fmt && ` · ${fmt.size}`}
      </div>
    </Card>
  )
}
