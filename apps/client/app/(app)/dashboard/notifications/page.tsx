"use client"

import { useState } from "react"
import { Card } from "@/components/ui/Card"
import { Badge, type BadgeTone } from "@/components/ui/Badge"
import { Icon, type IconName } from "@/components/ui/Icon"

const NOTIFS: Array<{ id: string; title: string; body: string; time: string; unread: boolean; icon: IconName | string; tone: BadgeTone }> = [
  { id: "n1", title: "Generation complete", body: "Your \"Summer Drop '25\" visual is ready.", time: "8 min ago", unread: true,  icon: "sparkles", tone: "acc" },
  { id: "n2", title: "Edit sent", body: "AI applied your feedback on Sale -40%.", time: "1 h ago", unread: true,  icon: "wand", tone: "plum" },
  { id: "n3", title: "Credits added", body: "+50 AI credits were added to your account.", time: "Yesterday", unread: false, icon: "credit", tone: "sage" },
  { id: "n4", title: "New feature", body: "Brand memories are now available.", time: "3 d ago", unread: false, icon: "rocket", tone: "gold" },
]

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(NOTIFS)
  const unreadCount = notifs.filter((n) => n.unread).length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <Card padding={0} style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 20, borderBottom: "1px solid var(--line-1)" }}>
          <div>
            <h2 className="display" style={{ fontSize: 20, margin: 0 }}>Recent activity</h2>
            <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{unreadCount} unread</p>
          </div>
          <button
            type="button"
            onClick={() => setNotifs((items) => items.map((item) => ({ ...item, unread: false })))}
            disabled={unreadCount === 0}
            style={{ background: "transparent", border: 0, color: unreadCount === 0 ? "var(--ink-3)" : "var(--acc)", fontSize: 13, fontWeight: 500, cursor: unreadCount === 0 ? "default" : "pointer" }}
          >
            Mark all as read
          </button>
        </div>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {notifs.map((n) => (
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
                  {n.unread && <Badge size="sm" tone="acc" dot>New</Badge>}
                </div>
                <p style={{ fontSize: 13, color: "var(--ink-2)", margin: 0 }}>{n.body}</p>
                <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", display: "block", marginTop: 6 }}>{n.time}</span>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
