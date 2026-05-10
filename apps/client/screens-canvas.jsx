// screens-canvas.jsx — the "Toile" page: secondary screens laid out side-by-side
// using the design_canvas starter component for pan/zoom + focus mode.

function ScreenCanvas() {
  return (
    <div style={{ margin: "-32px -36px" }}>
      <div style={{
        padding: "24px 36px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
        borderBottom: "1px solid var(--line-1)",
        background: "var(--bg-0)",
      }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--acc)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Toile</div>
          <h1 className="display" style={{ fontSize: 26, margin: "6px 0 0", letterSpacing: "-0.02em" }}>
            Tous les autres écrans
          </h1>
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4, maxWidth: 720 }}>
            Aperçu statique des écrans secondaires : abonnement, crédits, profil, paramètres IA, support, notifications, paramètres compte.
            Cliquez un écran pour l'ouvrir en plein écran (Esc pour fermer · ← → pour naviguer).
          </p>
        </div>
        <Badge tone="acc" icon="layout">7 écrans</Badge>
      </div>
      <div style={{ height: "calc(100vh - 220px)", minHeight: 600, background: "var(--bg-0)" }}>
        <DesignCanvas style={{ background: "var(--bg-0)" }}>
          <DCSection id="account" title="Compte & abonnement" subtitle="Plans, crédits, profil, sécurité">
            <DCArtboard id="subscription" label="Abonnement & crédits" width={1280} height={840}>
              <ArtboardFrame title="Abonnement & crédits" path="/subscription"><ArtboardSubscription /></ArtboardFrame>
            </DCArtboard>
            <DCArtboard id="profile" label="Profil utilisateur" width={1280} height={840}>
              <ArtboardFrame title="Profil" path="/profile"><ArtboardProfile /></ArtboardFrame>
            </DCArtboard>
            <DCArtboard id="settings" label="Paramètres compte" width={1280} height={840}>
              <ArtboardFrame title="Paramètres" path="/settings"><ArtboardSettings /></ArtboardFrame>
            </DCArtboard>
          </DCSection>

          <DCSection id="ai" title="IA & préférences" subtitle="Mémoires de marque, style par défaut">
            <DCArtboard id="ai-settings" label="Paramètres IA" width={1280} height={840}>
              <ArtboardFrame title="Paramètres IA client" path="/ai-settings"><ArtboardAISettings /></ArtboardFrame>
            </DCArtboard>
            <DCArtboard id="notifications" label="Notifications" width={720} height={840}>
              <ArtboardFrame title="Notifications" path="/notifications"><ArtboardNotifications /></ArtboardFrame>
            </DCArtboard>
          </DCSection>

          <DCSection id="support" title="Support" subtitle="FAQ, contact et tickets">
            <DCArtboard id="support-page" label="Support & assistance" width={1280} height={840}>
              <ArtboardFrame title="Support" path="/support"><ArtboardSupport /></ArtboardFrame>
            </DCArtboard>
            <DCArtboard id="ticket" label="Détail ticket" width={780} height={840}>
              <ArtboardFrame title="Ticket #2841" path="/support/2841"><ArtboardTicket /></ArtboardFrame>
            </DCArtboard>
          </DCSection>
        </DesignCanvas>
      </div>
    </div>
  );
}

// Generic frame wrapping each artboard with mock browser chrome
function ArtboardFrame({ title, path, children }) {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "var(--bg-0)", color: "var(--ink-0)",
      display: "flex", flexDirection: "column",
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{
        height: 36, background: "var(--bg-1)",
        borderBottom: "1px solid var(--line-1)",
        display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
        fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-3)",
      }}>
        <span style={{ display: "flex", gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#e08a64" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#d8a85a" }} />
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#8aa57a" }} />
        </span>
        <span style={{ flex: 1, textAlign: "center" }}>studio-flyer.ai{path}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", padding: "28px 32px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Subscription ────────────────────────────────────────
function ArtboardSubscription() {
  return (
    <div>
      <ArtH overline="Compte" title="Abonnement et crédits IA" desc="Choisissez le plan adapté à votre cadence de création." />

      {/* Current plan */}
      <Card padding={22} style={{ marginBottom: 24, background: "linear-gradient(135deg, var(--acc-soft), transparent)", borderColor: "var(--acc-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Badge tone="acc" icon="zap">Plan actuel · Pro</Badge>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, marginTop: 8, letterSpacing: "-0.02em" }}>87 / 100 crédits IA</div>
            <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>Renouvellement le 04 juin · 39€/mois</div>
            <div style={{ height: 6, width: 280, background: "var(--bg-3)", borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: "87%", background: "var(--acc)" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" icon="plus">Acheter des crédits</Button>
            <Button icon="trending">Changer de plan</Button>
          </div>
        </div>
      </Card>

      {/* Plans */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {[
          { name: "Gratuit",  price: "0€",  unit: "/mois", credits: "3 générations", features: ["Format 1080×1080", "Filigrane Studio Flyer", "Export PNG"] },
          { name: "Starter",  price: "19€", unit: "/mois", credits: "20 générations", features: ["Tous les formats", "Sans filigrane", "Export PNG, JPG", "Mémoires : 1 marque"] },
          { name: "Pro",      price: "39€", unit: "/mois", credits: "100 générations", features: ["+ Retouches illimitées", "Export PNG, JPG, PDF", "Mémoires : 5 marques", "Support prioritaire"], current: true },
          { name: "Business", price: "99€", unit: "/mois", credits: "400 générations", features: ["+ Génération avancée", "Export vectoriel SVG", "Mémoires illimitées", "Account manager dédié"] },
        ].map(p => (
          <Card key={p.name} padding={20} style={{ borderColor: p.current ? "var(--acc-line)" : "var(--line-1)", boxShadow: p.current ? "0 0 0 2px var(--acc-soft)" : "var(--sh-1)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500, fontSize: 14 }}>{p.name}</span>
              {p.current && <Badge size="sm" tone="acc">actuel</Badge>}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span className="display" style={{ fontSize: 30, letterSpacing: "-0.02em" }}>{p.price}</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{p.unit}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--acc-bright)", fontFamily: "var(--font-mono)" }}>{p.credits}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-1)" }}>
              {p.features.map(f => (
                <li key={f} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Icon name="check" size={11} stroke={2.5} style={{ color: "var(--acc)", marginTop: 4, flexShrink: 0 }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" full variant={p.current ? "outline" : "primary"} disabled={p.current}>
              {p.current ? "Plan actuel" : "Choisir " + p.name}
            </Button>
          </Card>
        ))}
      </div>

      <SectionTitle overline="Historique de facturation" title="Factures récentes" style={{ marginTop: 32, marginBottom: 16 }} />
      <Card padding={0}>
        {[
          { date: "04/05/2025", desc: "Abonnement Pro · Mai", amount: "39,00 €", status: "Payée" },
          { date: "04/04/2025", desc: "Abonnement Pro · Avril", amount: "39,00 €", status: "Payée" },
          { date: "21/03/2025", desc: "Pack 50 crédits supplémentaires", amount: "19,00 €", status: "Payée" },
          { date: "04/03/2025", desc: "Abonnement Pro · Mars", amount: "39,00 €", status: "Payée" },
        ].map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "120px 1fr 100px 80px 80px", gap: 16, alignItems: "center", padding: "14px 18px", borderTop: i > 0 ? "1px solid var(--line-1)" : 0, fontSize: 13 }}>
            <span style={{ color: "var(--ink-2)", fontFamily: "var(--font-mono)" }}>{r.date}</span>
            <span style={{ color: "var(--ink-0)" }}>{r.desc}</span>
            <span style={{ color: "var(--ink-1)", fontFamily: "var(--font-mono)" }}>{r.amount}</span>
            <Badge size="sm" tone="sage">{r.status}</Badge>
            <Button size="sm" variant="ghost" icon="download">PDF</Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Profile ────────────────────────────────────────
function ArtboardProfile() {
  return (
    <div>
      <ArtH overline="Compte" title="Profil utilisateur" desc="Vos informations personnelles et préférences globales." />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        <Card padding={20} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 12 }}>
          <Avatar name="Amélie Bonnet" size={84} />
          <div>
            <div style={{ fontWeight: 500, fontSize: 16 }}>Amélie Bonnet</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>amelie@studio-rond.fr</div>
          </div>
          <Badge tone="acc">Compte agence</Badge>
          <Button size="sm" variant="outline" icon="upload" full>Changer la photo</Button>
        </Card>

        <Card padding={24}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Input label="Nom complet" value="Amélie Bonnet" onChange={() => {}} />
            <Input label="Adresse e-mail" icon="message" value="amelie@studio-rond.fr" onChange={() => {}} />
            <Input label="Téléphone" value="+33 6 24 18 09 12" onChange={() => {}} />
            <Input label="Type de compte" value="Agence" onChange={() => {}} />
            <Input label="Nom de l'entreprise" value="Studio Rond" onChange={() => {}} />
            <Input label="Langue" value="Français" onChange={() => {}} />
          </div>
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--line-1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Modifications enregistrées il y a 2 jours</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="ghost">Annuler</Button>
              <Button icon="check">Sauvegarder</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Settings (security, sessions, danger) ─────────────
function ArtboardSettings() {
  return (
    <div>
      <ArtH overline="Compte" title="Paramètres" desc="Sécurité, sessions, intégrations et zone de danger." />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: 8, background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 12 }}>
          {[
            { label: "Sécurité", icon: "lock", active: true },
            { label: "Sessions", icon: "settings" },
            { label: "Intégrations", icon: "layers" },
            { label: "Zone de danger", icon: "trash" },
          ].map(it => (
            <button key={it.label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: it.active ? "var(--bg-3)" : "transparent",
              border: 0, borderRadius: 8, cursor: "pointer", textAlign: "left",
              color: it.active ? "var(--ink-0)" : "var(--ink-1)", fontSize: 13, fontWeight: 500,
              fontFamily: "var(--font-sans)",
            }}>
              <Icon name={it.icon} size={14} />
              {it.label}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card padding={22}>
            <div style={{ fontWeight: 500, marginBottom: 14 }}>Mot de passe</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input label="Mot de passe actuel" type="password" value="••••••••••" onChange={() => {}} />
              <Input label="Nouveau mot de passe" type="password" value="" onChange={() => {}} />
              <Input label="Confirmer" type="password" value="" onChange={() => {}} />
            </div>
            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
              <Button size="sm" icon="check">Mettre à jour</Button>
            </div>
          </Card>
          <Card padding={22}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div>
                <div style={{ fontWeight: 500 }}>Authentification à deux facteurs</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>Ajoutez une couche de sécurité avec une application d'authentification.</div>
              </div>
              <Badge tone="gold" icon="lock">Désactivée</Badge>
            </div>
            <Button size="sm" variant="outline" style={{ marginTop: 12 }}>Activer la 2FA</Button>
          </Card>
          <Card padding={22}>
            <div style={{ fontWeight: 500, marginBottom: 12 }}>Sessions actives</div>
            {[
              { device: "MacBook Pro · Chrome", loc: "Paris, France · maintenant", current: true },
              { device: "iPhone 15 · Safari", loc: "Paris, France · il y a 3 h", current: false },
              { device: "Windows 11 · Edge", loc: "Lyon, France · hier", current: false },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: i > 0 ? "1px solid var(--line-1)" : 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.device} {s.current && <Badge size="sm" tone="acc" style={{ marginLeft: 6 }}>actuelle</Badge>}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.loc}</div>
                </div>
                {!s.current && <Button size="sm" variant="ghost">Déconnecter</Button>}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── AI Settings ────────────────────────────────────────
function ArtboardAISettings() {
  const stylePicks = ["Élégant", "Événementiel", "Urbain"];
  return (
    <div>
      <ArtH overline="IA" title="Paramètres IA & mémoires de marque" desc="Définissez vos préférences par défaut. L'IA s'en souviendra à chaque génération." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card padding={22}>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Direction artistique par défaut</div>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 8, display: "block" }}>Styles préférés</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {stylePicks.map(s => <Badge key={s} tone="acc" icon="brush">{s}</Badge>)}
              <Badge tone="neutral" icon="plus">ajouter</Badge>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 8, display: "block" }}>Palette de marque</span>
            <div style={{ display: "flex", gap: 8 }}>
              {["#c66a45", "#1a0e08", "#f4ecd8", "#e08a64"].map(c => (
                <span key={c} style={{ width: 36, height: 36, borderRadius: 8, background: c, border: "1px solid var(--line-2)" }} />
              ))}
              <button style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px dashed var(--line-3)", color: "var(--ink-3)", cursor: "pointer" }}>
                <Icon name="plus" size={14} />
              </button>
            </div>
          </div>
          <Input label="Ton de communication" value="Chaleureux, raffiné, urbain" onChange={() => {}} hint="L'IA s'en inspirera pour les copys." />
        </Card>

        <Card padding={22}>
          <div style={{ fontWeight: 500, marginBottom: 14 }}>Cible et contexte</div>
          <Input label="Public cible habituel" icon="user" value="CSP+, 25-45 ans, urbains" onChange={() => {}} style={{ marginBottom: 12 }} />
          <Input label="Type de visuels fréquents" value="Affiches événement, stories Instagram" onChange={() => {}} style={{ marginBottom: 12 }} />
          <Input label="Formats par défaut" value="1080×1080 · 1080×1920" onChange={() => {}} style={{ marginBottom: 12 }} />
          <Textarea label="Instructions permanentes" rows={3} value="Toujours laisser un espace en bas pour la mention obligatoire. Pas de personnages dans les visuels événementiels. Préférer les compositions asymétriques." onChange={() => {}} />
        </Card>
      </div>

      <SectionTitle overline="Bibliothèque" title="Mémoires de marque" style={{ marginTop: 24, marginBottom: 14 }} action={<Button size="sm" variant="outline" icon="plus">Nouvelle marque</Button>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { name: "EVENTLAB",   colors: ["#c66a45", "#1a0e08", "#f4ecd8"], visuals: 12, last: "il y a 2h" },
          { name: "Maison Café", colors: ["#5d4a30", "#d8a85a", "#f4ecd8"], visuals: 6, last: "il y a 4h" },
          { name: "Marea",      colors: ["#b08bc7", "#e08a64", "#1a0e08"], visuals: 9, last: "hier" },
        ].map(b => (
          <Card key={b.name} padding={18} hover>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.06em", fontSize: 13 }}>{b.name}</span>
              <Badge size="sm">{b.visuals} visuels</Badge>
            </div>
            <div style={{ display: "flex", height: 32, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
              {b.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Dernière utilisation · {b.last}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────
function ArtboardNotifications() {
  const items = [
    { icon: "check",    tone: "sage", title: "Génération terminée", body: "Soirée After Work — 4 propositions disponibles", at: "il y a 2 min", unread: true },
    { icon: "wand",     tone: "acc",  title: "Retouche appliquée",   body: "Brunch dominical · v2 · couleurs ajustées",     at: "il y a 1 h",  unread: true },
    { icon: "zap",      tone: "gold", title: "Crédits faibles",      body: "Il vous reste 13 crédits ce mois-ci",            at: "il y a 4 h",  unread: false },
    { icon: "message",  tone: "neutral", title: "Réponse du support", body: "Re : Export PDF — votre ticket #2841",        at: "hier",        unread: false },
    { icon: "trending", tone: "acc",  title: "Nouvelle fonctionnalité", body: "Mémoires de marque illimitées sur Pro",     at: "il y a 2j",   unread: false },
  ];
  return (
    <div>
      <ArtH overline="Activité" title="Notifications" desc="Toutes vos alertes en un coup d'œil." />
      <Card padding={0}>
        <div style={{ display: "flex", gap: 4, padding: 10, borderBottom: "1px solid var(--line-1)" }}>
          <Tabs value="all" onChange={() => {}} options={[
            { value: "all", label: "Tout (5)" },
            { value: "unread", label: "Non lues (2)" },
            { value: "mentions", label: "@Mentions" },
          ]} />
        </div>
        {items.map((n, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "14px 18px",
            borderTop: i > 0 ? "1px solid var(--line-1)" : 0,
            background: n.unread ? "var(--acc-soft)" : "transparent",
          }}>
            <span style={{
              width: 32, height: 32, borderRadius: 8,
              background: n.tone === "sage" ? "var(--sage-soft)" : n.tone === "acc" ? "var(--acc-soft)" : n.tone === "gold" ? "var(--gold-soft)" : "var(--bg-3)",
              color: n.tone === "sage" ? "var(--sage)" : n.tone === "acc" ? "var(--acc-bright)" : n.tone === "gold" ? "var(--gold)" : "var(--ink-1)",
              display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Icon name={n.icon} size={14} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{n.title}</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{n.at}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2, lineHeight: 1.45 }}>{n.body}</div>
            </div>
            {n.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--acc)", flexShrink: 0, marginTop: 6 }} />}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Support ────────────────────────────────────────
function ArtboardSupport() {
  return (
    <div>
      <ArtH overline="Aide" title="Support & assistance" desc="FAQ, tickets et contact direct." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <Card padding={24}>
          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="message" size={14} style={{ color: "var(--acc)" }} />
            Nouveau ticket
          </div>
          <Input label="Sujet" value="" onChange={() => {}} placeholder="Ex : Mon export PDF est flou" style={{ marginBottom: 12 }} />
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-1)", marginBottom: 8, display: "block" }}>Catégorie</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["Bug", "Question IA", "Facturation", "Suggestion", "Autre"].map(c => (
                <button key={c} style={{
                  padding: "5px 12px", background: c === "Bug" ? "var(--acc-soft)" : "var(--bg-1)",
                  border: `1px solid ${c === "Bug" ? "var(--acc-line)" : "var(--line-2)"}`,
                  borderRadius: 999, color: c === "Bug" ? "var(--acc-bright)" : "var(--ink-1)",
                  fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>{c}</button>
              ))}
            </div>
          </div>
          <Textarea label="Description" rows={4} value="" onChange={() => {}} placeholder="Décrivez votre problème ou question…" />
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Button size="sm" variant="ghost" icon="upload">Joindre un fichier</Button>
            <Button icon="send">Envoyer le ticket</Button>
          </div>
        </Card>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>FAQ</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { q: "Comment fonctionne la facturation des crédits ?", open: true, a: "Chaque génération consomme 1 crédit. Les retouches sont gratuites sur les plans Pro et Business. Les crédits non utilisés sont reportés sur le mois suivant dans la limite de 200." },
              { q: "Puis-je utiliser mes propres logos et images ?" },
              { q: "Quels formats d'export sont disponibles ?" },
              { q: "Comment supprimer définitivement mon compte ?" },
              { q: "L'IA peut-elle reproduire un modèle existant ?" },
            ].map((f, i) => (
              <div key={i} style={{ background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{f.q}</span>
                  <Icon name={f.open ? "chevR" : "chevR"} size={13} style={{ color: "var(--ink-3)", transform: f.open ? "rotate(90deg)" : "none" }} />
                </div>
                {f.a && <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 8, lineHeight: 1.55 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle overline="Mes demandes" title="Tickets précédents" style={{ marginBottom: 14 }} />
      <Card padding={0}>
        {[
          { id: "#2841", subj: "Export PDF flou en haute déf.",     cat: "Bug",        status: "En cours",    tone: "acc",  at: "il y a 2 j" },
          { id: "#2738", subj: "Comment partager une marque avec un client ?", cat: "Question IA", status: "Résolu", tone: "sage", at: "il y a 1 sem" },
          { id: "#2611", subj: "Augmenter mes crédits ponctuellement",  cat: "Facturation", status: "Résolu", tone: "sage", at: "il y a 3 sem" },
        ].map((t, i) => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr 110px 110px 80px", gap: 14, alignItems: "center", padding: "13px 18px", borderTop: i > 0 ? "1px solid var(--line-1)" : 0, fontSize: 13 }}>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)", fontSize: 12 }}>{t.id}</span>
            <span>{t.subj}</span>
            <Badge size="sm" tone="neutral">{t.cat}</Badge>
            <Badge size="sm" tone={t.tone}>{t.status}</Badge>
            <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{t.at}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Ticket detail ────────────────────────────────────────
function ArtboardTicket() {
  return (
    <div>
      <ArtH overline="Ticket #2841" title="Export PDF flou en haute déf." desc="Ouvert il y a 2 jours · catégorie Bug · priorité moyenne" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <Badge tone="acc">En cours</Badge>
          <Badge tone="neutral" icon="user">Assigné · Camille</Badge>
        </div>
        {[
          { who: "Vous", at: "il y a 2 j", body: "Bonjour, lorsque j'exporte mes affiches en PDF haute définition, le rendu est flou alors qu'en PNG il est net. J'ai testé sur 3 visuels différents. Pouvez-vous regarder ?", me: true },
          { who: "Camille (Studio Flyer AI)", at: "il y a 1 j", body: "Bonjour Amélie, merci pour votre retour. Nous identifions le problème — il concerne les exports PDF des visuels au format A4 générés avant le 4 mai. Nous préparons un correctif pour cette semaine. Je reviens vers vous." },
          { who: "Vous", at: "il y a 6 h", body: "Parfait, merci !", me: true },
        ].map((m, i) => (
          <div key={i} style={{
            padding: 14, background: m.me ? "var(--bg-1)" : "var(--acc-soft)",
            border: `1px solid ${m.me ? "var(--line-1)" : "var(--acc-line)"}`,
            borderRadius: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{m.who}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{m.at}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-1)", lineHeight: 1.55 }}>{m.body}</div>
          </div>
        ))}
        <div style={{ padding: 12, background: "var(--bg-1)", border: "1px solid var(--line-1)", borderRadius: 12 }}>
          <Textarea rows={3} placeholder="Ajouter une réponse…" value="" onChange={() => {}} />
          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
            <Button size="sm" variant="ghost" icon="upload">Joindre</Button>
            <Button size="sm" icon="send">Envoyer</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Header utility
function ArtH({ overline, title, desc }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--acc)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{overline}</div>
      <h2 className="display" style={{ fontSize: 24, margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      {desc && <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4, maxWidth: 640, lineHeight: 1.55 }}>{desc}</p>}
    </div>
  );
}

window.ScreenCanvas = ScreenCanvas;
