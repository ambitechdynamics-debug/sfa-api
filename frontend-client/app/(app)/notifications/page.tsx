"use client"

import { Card } from "@/components/ui/Card"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { Icon, type IconName } from "@/components/ui/Icon"

const NOTIFS: Array<{ id: string; title: string; body: string; time: string; unread: boolean; icon: IconName | string; tone: BadgeTone }> = [
  { id: "n1", title: "Génération terminée", body: "Votre visuel « Drop Été '25 » est prêt.", time: "il y a 8 min", unread: true,  icon: "sparkles", tone: "acc" },
  { id: "n2", title: "Retouche envoyée",    body: "L'IA a appliqué vos remarques sur Soldes -40%.", time: "il y a 1 h", unread: true,  icon: "wand", tone: "plum" },
  { id: "n3", title: "Crédits ajoutés",     body: "+50 crédits IA ont été ajoutés à votre compte.", time: "hier", unread: false, icon: "credit", tone: "sage" },
  { id: "n4", title: "Nouvelle fonctionnalité", body: "Les mémoires de marque sont disponibles.", time: "il y a 3 j", unread: false, icon: "rocket", tone: "gold" },
]

export default function NotificationsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottom: "1px solid var(--line-1)" }}>
          <div>
            <h2 className="display" style={{ fontSize: 20, margin: 0 }}>Activité récente</h2>
            <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{NOTIFS.filter((n) => n.unread).length} non lue(s)</p>
          </div>
          <button style={{ background: "transparent", border: 0, color: "var(--acc)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
            Tout marquer comme lu
          </button>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {NOTIFS.map((n) => (
            <li
              key={n.id}
              style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                padding: 18, borderBottom: "1px solid var(--line-1)",
                background: n.unread ? "var(--acc-soft)" : "transparent",
              }}
            >
              <div
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `var(--${n.tone === "neutral" ? "bg-3" : n.tone}-soft)`,
                  color: `var(--${n.tone === "neutral" ? "ink-1" : n.tone})`,
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon name={n.icon} size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</span>
                  {n.unread && <Badge size="sm" tone="acc" dot>Nouveau</Badge>}
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>{n.body}</p>
                <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", display: "block", marginTop: 6 }}>{n.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding={20} style={{ borderColor: "var(--gold-soft)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Icon name="info" size={16} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0, lineHeight: 1.55 }}>
            Les notifications affichées ici sont des exemples. La synchronisation temps réel avec votre activité sera bientôt disponible.
          </p>
        </div>
      </Card>
    </div>
  )
}
