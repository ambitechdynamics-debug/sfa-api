// screens-marketing.jsx — Landing page

function MarketingNav({ transparent }) {
  const { goto } = useNav();
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 50,
      background: transparent ? "rgba(16, 12, 8, 0.65)" : "var(--bg-0)",
      backdropFilter: "saturate(160%) blur(14px)",
      WebkitBackdropFilter: "saturate(160%) blur(14px)",
      borderBottom: "1px solid var(--line-1)",
    }}>
      <nav style={{
        maxWidth: 1280, margin: "0 auto", padding: "16px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a onClick={() => goto("landing")} style={{ cursor: "pointer" }}>
          <BrandMark size={22} />
        </a>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {[
            { label: "Fonctionnalités", href: "#features" },
            { label: "Galerie",         href: "#gallery"  },
            { label: "Tarifs",          href: "#pricing"  },
            { label: "FAQ",             href: "#faq"      },
          ].map(l => (
            <a key={l.href} href={l.href} style={{
              padding: "8px 14px", fontSize: 14, color: "var(--ink-1)",
              borderRadius: 8, transition: "background 150ms",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >{l.label}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => goto("login")}>Connexion</Button>
          <Button size="sm" icon="sparkles" onClick={() => goto("register")}>Essayer gratuitement</Button>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const { goto } = useNav();
  return (
    <section style={{ position: "relative", overflow: "hidden", paddingBottom: 120 }}>
      {/* Ambient glow */}
      <div aria-hidden style={{
        position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)",
        width: 1200, height: 800, pointerEvents: "none",
        background: "radial-gradient(50% 60% at 50% 50%, var(--acc-soft) 0%, transparent 70%)",
        filter: "blur(20px)",
      }} />
      <div aria-hidden style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "linear-gradient(var(--line-1) 1px, transparent 1px), linear-gradient(90deg, var(--line-1) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
        WebkitMaskImage: "radial-gradient(70% 60% at 50% 0%, black, transparent)",
      }} />

      <div style={{
        position: "relative", maxWidth: 1280, margin: "0 auto",
        padding: "100px 32px 0", textAlign: "center",
      }}>
        <Badge tone="acc" icon="sparkles" style={{ marginBottom: 28 }}>Nouveau · Mémoires de marque</Badge>

        <h1 className="display anim-fade-up" style={{
          margin: 0, fontSize: "clamp(48px, 7vw, 92px)",
          fontWeight: 600, letterSpacing: "-0.04em",
          maxWidth: 1100, marginInline: "auto",
        }}>
          Créez des affiches{" "}
          <span className="serif" style={{ color: "var(--acc)" }}>professionnelles</span>{" "}
          avec l'intelligence artificielle.
        </h1>

        <p className="anim-fade-up" style={{
          margin: "28px auto 0", maxWidth: 640,
          fontSize: 18, color: "var(--ink-2)", lineHeight: 1.55,
          animationDelay: "100ms",
        }}>
          Studio Flyer AI aide les entreprises, créateurs et agences à générer
          rapidement des visuels marketing de qualité — flyers, affiches, stories,
          menus. Briefez, générez, retouchez. En une minute.
        </p>

        <div className="anim-fade-up" style={{
          marginTop: 36, display: "flex", justifyContent: "center", gap: 12,
          flexWrap: "wrap", animationDelay: "200ms",
        }}>
          <Button size="xl" icon="sparkles" onClick={() => goto("register")}>Commencer maintenant</Button>
          <Button size="xl" variant="outline" iconRight="arrowR" onClick={() => {
            const el = document.querySelector("#gallery");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }}>Voir des exemples</Button>
        </div>

        <div className="anim-fade-up" style={{
          marginTop: 24, fontSize: 13, color: "var(--ink-3)",
          display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap",
          animationDelay: "300ms",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--sage)" }} />
            3 générations gratuites
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--sage)" }} />
            Sans carte bancaire
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Icon name="check" size={14} stroke={2.5} style={{ color: "var(--sage)" }} />
            Export HD inclus
          </span>
        </div>
      </div>

      {/* Hero showcase: a "browser" with the create UI inside */}
      <div className="anim-fade-up" style={{
        position: "relative", maxWidth: 1180, margin: "80px auto 0", padding: "0 32px",
        animationDelay: "400ms",
      }}>
        <HeroShowcase />
      </div>
    </section>
  );
}

function HeroShowcase() {
  return (
    <div style={{
      position: "relative", borderRadius: 20,
      background: "var(--bg-1)",
      border: "1px solid var(--line-2)",
      boxShadow: "0 60px 120px rgba(0,0,0,0.6), 0 0 0 1px var(--line-1)",
      overflow: "hidden",
    }}>
      {/* Window chrome */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px", borderBottom: "1px solid var(--line-1)",
        background: "var(--bg-2)",
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a2d22" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a2d22" }} />
          <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#3a2d22" }} />
        </div>
        <div style={{
          margin: "0 auto", padding: "5px 14px",
          background: "var(--bg-1)", border: "1px solid var(--line-1)",
          borderRadius: 999, fontSize: 12, color: "var(--ink-2)",
          fontFamily: "var(--font-mono)",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Icon name="lock" size={11} />
          studio-flyer.ai/create
        </div>
        <span style={{ width: 60 }} />
      </div>

      {/* Showcase: brief left, results right */}
      <div style={{
        display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 520,
      }}>
        {/* Brief sidebar */}
        <div style={{
          padding: 24, borderRight: "1px solid var(--line-1)",
          display: "flex", flexDirection: "column", gap: 18,
          background: "var(--bg-1)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--acc)", letterSpacing: "0.1em" }}>BRIEF · ÉTAPE 3/7</span>
            <Badge size="sm" tone="acc" dot>Live</Badge>
          </div>
          <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: "42%", height: "100%", background: "var(--acc)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Type de visuel</div>
            <Badge tone="acc" icon="calendar">Affiche événement</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Message principal</div>
            <div style={{
              padding: 12, background: "var(--bg-2)", border: "1px solid var(--line-1)",
              borderRadius: 8, fontSize: 13, lineHeight: 1.5, color: "var(--ink-1)",
            }}>
              Soirée After Work du vendredi 12 mai, ambiance chaleureuse, bar à cocktails, DJ set jusqu'à 1h.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Style</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <Badge tone="neutral">Élégant</Badge>
              <Badge tone="neutral">Chaleureux</Badge>
              <Badge tone="neutral">Soirée</Badge>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--ink-2)", fontWeight: 500 }}>Palette</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["#c66a45", "#1a0e08", "#f4ecd8", "#d8a85a"].map(c => (
                <div key={c} style={{ width: 28, height: 28, background: c, borderRadius: 6, border: "1px solid var(--line-2)" }} />
              ))}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Button full icon="sparkles">Générer 4 propositions</Button>
        </div>

        {/* Results grid */}
        <div style={{
          padding: 24, background: "var(--bg-0)",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="display" style={{ fontSize: 18, marginBottom: 2 }}>4 propositions</div>
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>Générées en 38 secondes · Cliquez pour retoucher</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <Button size="sm" variant="outline" icon="refresh">Régénérer</Button>
              <Button size="sm" variant="secondary" icon="download">Exporter</Button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, flex: 1 }}>
            <PosterEditorial title={"Soirée\nAfter Work"} date="Vendredi 12 Mai" venue="Le Loft · Paris 10" brand="EVENTLAB" />
            <PosterMusic title={"Soirée\nAfter Work"} artist="EVENTLAB" date="12.05" venue="Le Loft · Paris 10" />
            <PosterMenu title={"After\nWork"} price="Gratuit" brand="EVENTLAB" ratio="1/1" />
            <PosterCorp title={"Soirée\nAfter Work"} date="12 Mai" brand="EVENTLAB" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBlock() {
  const features = [
    { icon: "zap",     title: "Création rapide",         desc: "De l'idée au visuel en moins d'une minute. Vraiment." },
    { icon: "wand",    title: "Visuels professionnels",  desc: "Composition, typographie, hiérarchie. Pas de bricolage." },
    { icon: "edit",    title: "Retouches en langage naturel", desc: "« Plus chaleureux », « bouge le logo en haut » — l'IA comprend." },
    { icon: "rocket",  title: "Tous les formats",        desc: "Stories, A4, A5, bannières, posts. Adaptés au pixel près." },
    { icon: "download", title: "Export HD",              desc: "PNG, PDF print 300dpi, JPEG, SVG. Sans filigrane dès Starter." },
    { icon: "palette", title: "Mémoires de marque",      desc: "L'IA mémorise votre identité et l'applique sans effort." },
  ];
  return (
    <section id="features" style={{ padding: "120px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <SectionTitle
        overline="Fonctionnalités"
        title="Tout ce qu'il faut pour briefer, générer, livrer."
        subtitle="Studio Flyer AI ne remplace pas votre direction artistique. Il accélère le travail répétitif pour vous laisser créer mieux, plus vite."
      />
      <div style={{
        marginTop: 56,
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24,
      }}>
        {features.map((f, i) => (
          <div key={f.title} className="anim-fade-up" style={{
            padding: 32,
            background: "var(--bg-1)",
            border: "1px solid var(--line-1)",
            borderRadius: 16,
            animationDelay: `${i * 60}ms`,
            transition: "transform 240ms, border-color 240ms",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--line-3)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--line-1)"; e.currentTarget.style.transform = ""; }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: "var(--acc-soft)", color: "var(--acc-bright)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--acc-line)",
              marginBottom: 20,
            }}>
              <Icon name={f.icon} size={20} />
            </div>
            <div className="display" style={{ fontSize: 20, marginBottom: 8 }}>{f.title}</div>
            <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Décrivez votre besoin",  desc: "Type de visuel, message, ton, public cible. Un brief simple, en français." },
    { n: "02", title: "Choisissez votre style", desc: "Moderne, luxe, événementiel, urbain… ou laissez l'IA proposer." },
    { n: "03", title: "L'IA génère 4 propositions", desc: "En moins d'une minute, prêtes à être comparées, ajustées, validées." },
    { n: "04", title: "Téléchargez ou retouchez", desc: "Export HD, ou demandez des retouches en langage naturel jusqu'à la perfection." },
  ];
  return (
    <section style={{
      padding: "120px 32px", background: "var(--bg-1)",
      borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionTitle
          overline="Comment ça marche"
          title="4 étapes. Une minute. Un visuel pro."
          subtitle="Aucune compétence en design requise. Vous décrivez ce dont vous avez besoin, l'IA fait le reste."
        />
        <div style={{
          marginTop: 56, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20,
        }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ position: "relative" }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--acc)",
                letterSpacing: "0.15em", marginBottom: 16,
              }}>{s.n}</div>
              <div className="display" style={{ fontSize: 22, marginBottom: 10, letterSpacing: "-0.02em" }}>{s.title}</div>
              <div style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>{s.desc}</div>
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: 6, right: -10, width: 20, height: 1,
                  background: "linear-gradient(90deg, var(--line-3), transparent)",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  return (
    <section id="gallery" style={{ padding: "120px 32px", maxWidth: 1280, margin: "0 auto" }}>
      <SectionTitle
        overline="Galerie"
        title="Quelques visuels générés en une minute."
        subtitle="Tous ces exemples sont issus de briefs clients réels. Aucune retouche manuelle dans Photoshop — uniquement Studio Flyer AI."
        action={<Button variant="outline" iconRight="arrowR">Voir toute la galerie</Button>}
      />
      <div style={{
        marginTop: 56,
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gridAutoRows: "minmax(120px, auto)",
        gap: 16,
      }}>
        <div style={{ gridColumn: "span 4" }}><PosterEditorial /></div>
        <div style={{ gridColumn: "span 3" }}><PosterMenu ratio="1/1" /></div>
        <div style={{ gridColumn: "span 5" }}>
          <PosterFrame ratio="16/9">
            <PosterCorp title={"Lancement\nProduit"} date="Q3 2025" brand="NORTH LABS" ratio="16/9" />
          </PosterFrame>
        </div>
        <div style={{ gridColumn: "span 3" }}><PosterMusic /></div>
        <div style={{ gridColumn: "span 4" }}><PosterLaunch ratio="1/1" /></div>
        <div style={{ gridColumn: "span 5" }}>
          <PosterFrame ratio="16/9">
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(135deg, #2a1a10 0%, #1a0e08 100%)",
              padding: "5%", display: "flex", flexDirection: "column", justifyContent: "space-between",
              color: "#f4ecd8",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4cqw", letterSpacing: "0.1em", color: "#d8a85a" }}>WEBINAR · 28 MAI</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "8cqw", lineHeight: 0.95, fontWeight: 600 }}>
                Maîtriser l'IA<br/>pour le design.
              </div>
              <div style={{ fontSize: "1.6cqw", color: "#d8c5a3" }}>4 intervenants · 90 min · Inscription gratuite</div>
            </div>
          </PosterFrame>
        </div>
        <div style={{ gridColumn: "span 4" }}><PosterSale /></div>
      </div>
    </section>
  );
}

function Pricing() {
  const { goto } = useNav();
  return (
    <section id="pricing" style={{
      padding: "120px 32px", background: "var(--bg-1)",
      borderTop: "1px solid var(--line-1)", borderBottom: "1px solid var(--line-1)",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionTitle
          overline="Tarifs"
          title="Un plan pour chaque besoin."
          subtitle="Sans engagement. Annulez à tout moment. Tous les plans incluent l'export HD et l'historique de vos visuels."
        />
        <div style={{
          marginTop: 56, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16,
        }}>
          {PLANS.map(p => (
            <PricingCard key={p.id} plan={p} onClick={() => goto("register")} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, onClick }) {
  return (
    <div style={{
      position: "relative",
      padding: 28,
      background: plan.featured ? "var(--bg-2)" : "var(--bg-1)",
      border: `1px solid ${plan.featured ? "var(--acc-line)" : "var(--line-1)"}`,
      borderRadius: 16,
      boxShadow: plan.featured ? "var(--sh-acc)" : "var(--sh-1)",
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      {plan.featured && (
        <div style={{
          position: "absolute", top: -10, left: 24,
          padding: "3px 10px", background: "var(--acc)",
          color: "var(--acc-ink)", borderRadius: 999,
          fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
        }}>POPULAIRE</div>
      )}
      <div>
        <div className="display" style={{ fontSize: 22, marginBottom: 4 }}>{plan.name}</div>
        <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{plan.desc}</div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="display" style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.04em" }}>{plan.price}</span>
        <span style={{ color: "var(--ink-2)", fontSize: 14 }}>{plan.period}</span>
      </div>
      <Button full variant={plan.featured ? "primary" : "outline"} onClick={onClick}>{plan.cta}</Button>
      <div style={{ height: 1, background: "var(--line-1)" }} />
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {plan.features.map(f => (
          <li key={f} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--ink-1)" }}>
            <span style={{
              flexShrink: 0, marginTop: 2,
              width: 16, height: 16, borderRadius: "50%",
              background: "var(--acc-soft)", color: "var(--acc-bright)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}><Icon name="check" size={10} stroke={2.5} /></span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqSection() {
  const [open, setOpen] = React.useState(0);
  return (
    <section id="faq" style={{ padding: "120px 32px", maxWidth: 920, margin: "0 auto" }}>
      <SectionTitle
        overline="FAQ"
        title="Les questions qu'on nous pose."
      />
      <div style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 8 }}>
        {FAQ.map((item, i) => (
          <div key={i} style={{
            background: "var(--bg-1)", border: "1px solid var(--line-1)",
            borderRadius: 12, overflow: "hidden",
          }}>
            <button onClick={() => setOpen(open === i ? -1 : i)}
              style={{
                width: "100%", padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: 16, background: "transparent", border: 0,
                color: "var(--ink-0)", textAlign: "left", cursor: "pointer",
                fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500,
              }}>
              {item.q}
              <Icon name="chevronD" size={18} style={{
                color: "var(--ink-2)",
                transform: open === i ? "rotate(180deg)" : "",
                transition: "transform 200ms",
              }} />
            </button>
            {open === i && (
              <div style={{
                padding: "0 24px 22px",
                color: "var(--ink-2)", fontSize: 14, lineHeight: 1.65,
                animation: "fadeUp 200ms ease",
              }}>{item.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  const { goto } = useNav();
  return (
    <section style={{ padding: "100px 32px" }}>
      <div style={{
        maxWidth: 1080, margin: "0 auto",
        padding: "80px 56px",
        background: "linear-gradient(135deg, #c66a45 0%, #2a1a10 100%)",
        borderRadius: 24,
        position: "relative", overflow: "hidden",
        textAlign: "center",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(rgba(245,238,226,0.12) 1px, transparent 1.5px)",
          backgroundSize: "16px 16px",
          maskImage: "radial-gradient(60% 80% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(60% 80% at 50% 50%, black, transparent)",
        }} />
        <div style={{ position: "relative", color: "#f4ecd8" }}>
          <h2 className="display" style={{
            margin: 0, fontSize: "clamp(36px, 5vw, 56px)",
            letterSpacing: "-0.03em", maxWidth: 720, marginInline: "auto",
          }}>
            Votre prochain visuel se trouve à <span className="serif">une minute</span> d'ici.
          </h2>
          <p style={{ margin: "20px auto 0", maxWidth: 480, fontSize: 16, color: "rgba(244,236,216,0.75)", lineHeight: 1.6 }}>
            Trois générations gratuites pour démarrer. Aucune carte bancaire requise.
          </p>
          <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Button size="xl" icon="sparkles" onClick={() => goto("register")} style={{ background: "#f4ecd8", color: "#2a1a10", border: "1px solid #f4ecd8" }}>
              Créer mon compte
            </Button>
            <Button size="xl" variant="ghost" onClick={() => goto("login")} style={{ color: "#f4ecd8" }} iconRight="arrowR">
              J'ai déjà un compte
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line-1)", background: "var(--bg-1)" }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "56px 32px 40px",
        display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 40,
      }}>
        <div>
          <BrandMark size={20} />
          <p style={{
            marginTop: 16, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 320,
          }}>
            La création visuelle assistée par IA pour les entreprises, créateurs et agences.
          </p>
        </div>
        {[
          { title: "Produit", links: ["Fonctionnalités", "Galerie", "Tarifs", "Nouveautés", "Roadmap"] },
          { title: "Ressources", links: ["Blog", "Guides", "API", "Tutoriels", "Templates"] },
          { title: "Entreprise", links: ["À propos", "Carrières", "Presse", "Contact", "Partenaires"] },
          { title: "Légal", links: ["CGU", "CGV", "Confidentialité", "Cookies", "RGPD"] },
        ].map(col => (
          <div key={col.title}>
            <div style={{
              fontSize: 12, fontWeight: 600, color: "var(--ink-1)",
              letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 16,
            }}>{col.title}</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map(l => (
                <li key={l}><a href="#" style={{ fontSize: 13, color: "var(--ink-2)" }}>{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "24px 32px",
        borderTop: "1px solid var(--line-1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 12, color: "var(--ink-3)",
      }}>
        <span>© 2025 Studio Flyer AI · Made with care in Paris</span>
        <span style={{ fontFamily: "var(--font-mono)" }}>v0.4.2</span>
      </div>
    </footer>
  );
}

function ScreenLanding() {
  return (
    <>
      <MarketingNav transparent />
      <Hero />
      <FeatureBlock />
      <HowItWorks />
      <Gallery />
      <Pricing />
      <FaqSection />
      <CTA />
      <Footer />
    </>
  );
}

window.ScreenLanding = ScreenLanding;
window.MarketingNav = MarketingNav;
window.PricingCard = PricingCard;
