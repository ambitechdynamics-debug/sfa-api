"use client"

import { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Icon } from "@/components/ui/Icon"
import { Input, Textarea } from "@/components/ui/Input"

const FAQ = [
  { q: "How does AI generation work?", a: "Simply describe the poster to create. AI turns your prompt into a project, applies useful options, and sends you to generated variations." },
  { q: "Are my visuals royalty-free?", a: "Yes, all visuals generated through your subscription belong to you and can be used commercially without restriction." },
  { q: "Can I guide the brand style?", a: "Yes. Add the brand name, visual tone, and constraints in the prompt or simple creation options." },
  { q: "How do edits work?", a: "On each proposal, describe what you want to change in a few words. AI regenerates while keeping the composition." },
  { q: "Can I cancel my subscription?", a: "At any time from the Subscription page. There is no commitment and no cancellation fee." },
  { q: "Which export formats are available?", a: "High-resolution PNG, print PDF (CMYK, 300 DPI), web JPEG, and SVG." },
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
        <h2 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 4 }}>Frequently asked questions</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>Find answers quickly.</p>

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
        <h2 className="display" style={{ fontSize: 22, margin: 0, marginBottom: 4 }}>Contact support</h2>
        <p style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 20 }}>
          Our team replies within 24 business hours. Pro and Business plans get priority support.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ex. Issue during a generation" />
          <Textarea label="Message" rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your request..." />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button icon="send" onClick={sendMail}>Send email</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
