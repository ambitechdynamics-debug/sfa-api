"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Avatar } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { useAuthStore } from "@/store/auth-store"
import { apiFetch, ApiError } from "@/lib/api"
import type { User } from "@/types/user"

export default function ProfilePage() {
  const { user, setUser } = useAuthStore()
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName)
      setPhone(user.phone ?? "")
    }
  }, [user])

  async function save() {
    setSaving(true)
    try {
      const updated = await apiFetch<User>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName, phone: phone || undefined }),
      })
      setUser(updated)
      toast.success("Profil mis à jour")
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Erreur"
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <Card padding={28}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <Avatar name={user.fullName} size={72} />
          <div>
            <h2 className="display" style={{ fontSize: 22, margin: 0 }}>{user.fullName}</h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "4px 0 8px" }}>{user.email}</p>
            <Badge size="sm" tone="acc">{user.role === "ADMIN" ? "Administrateur" : "Utilisateur Pro"}</Badge>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} icon="user" />
          <Input label="E-mail (lecture seule)" value={user.email} disabled icon="message" />
          <Input label="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} icon="bell" placeholder="+33 6 12 34 56 78" />
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={save} disabled={saving} icon={saving ? undefined : "check"}>{saving ? "Enregistrement…" : "Enregistrer"}</Button>
        </div>
      </Card>

      <Card padding={28}>
        <h3 className="display" style={{ fontSize: 18, marginTop: 0, marginBottom: 12 }}>Statistiques compte</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <Stat label="Crédits" value={user.credits} />
          <Stat label="Membre depuis" value={new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })} />
          <Stat label="Rôle" value={user.role} />
        </div>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: 16, background: "var(--bg-1)", borderRadius: 10, border: "1px solid var(--line-1)" }}>
      <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
      <div className="display" style={{ fontSize: 22, marginTop: 4 }}>{value}</div>
    </div>
  )
}
