"use client"

import { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { Input, Textarea } from "@/components/ui/Input"

const FAQ = [
  { q: "Comment fonctionne la génération par IA ?", a: "Décrivez simplement l'affiche à créer. L'IA transforme votre prompt en projet, applique les options utiles et vous envoie vers les variantes générées." },
  { q: "Mes visuels sont-ils libres de droits ?", a: "Oui, tous les visuels générés via votre abonnement vous appartiennent et sont utilisables commercialement sans restriction." },
  { q: "Puis-je guider le style de marque ?", a: "Oui. Ajoutez le nom de marque, le ton visuel et les contraintes dans le prompt ou dans les options simples de création." },
  { q: "Comment se passent les retouches ?", a: "Sur chaque proposition, décrivez en quelques mots ce que vous souhaitez changer. L'IA régénère en gardant la composition." },
  { q: "Puis-je annuler mon abonnement ?", a: "À tout moment, depuis la page Abonnement. Aucun engagement, aucun frais d'annulation." },
  { q: "Quels formats d'export sont disponibles ?", a: "PNG haute résolution, PDF print (CMJN, 300 DPI), JPEG web et SVG." },
]

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  function sendMail() {
    const url = `mailto:support@studio-flyer.ai?subject=${encodeURIComponent(subject || "Support")}&body=${encodeURIComponent(body)}`
    window.location.href = url
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 880 }}>
      {/* FAQ */}
      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 4 }}>Questions fréquentes</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>Trouvez vos réponses rapidement.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {FAQ.map((it, i) => {
            const open = openFaq === i
            return (
              <div key={i} style={{ border: "1px solid var(--line-1)", borderRadius: 10, overflow: "hidden", background: "var(--bg-1)" }}>
                <button
                  onClick={() => setOpenFaq(open ? null : i)}
                  style={{
                    width: "100%", padding: "14px 18px", background: "transparent", border: 0,
                    color: "var(--ink-0)", fontSize: 14, fontWeight: 500, textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer",
                  }}
                >
                  <span>{it.q}</span>
                  <Icon name={open ? "chevronU" : "chevronD"} size={14} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
                </button>
                {open && (
                  <div className="anim-fade-up" style={{ padding: "0 18px 14px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
                    {it.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Contact */}
      <Card padding={28}>
        <h2 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 4 }}>Contacter le support</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 20 }}>
          Notre équipe répond sous 24h ouvrées. Pour les plans Pro et Business, support prioritaire.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. : Problème lors d'une génération" />
          <Textarea label="Message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Décrivez votre demande…" />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button icon="send" onClick={sendMail}>Envoyer un e-mail</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
