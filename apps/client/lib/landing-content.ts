/**
 * Landing page i18n content (FR / EN).
 * Studio Flyer AI — générateur IA de visuels publicitaires.
 */

export type Lang = "fr" | "en"

export interface LandingContent {
  brand: string
  tagline: string
  nav: { home: string; templates: string; uses: string; pricing: string; reviews: string; contact: string }
  cta: {
    launch: string; tryFree: string; bookDemo: string; seeTemplates: string;
    start: string; signin: string; signup: string; contact: string
  }
  hero: {
    chip: string
    title: [string, string, string]
    subtitle: string
    meta1: string; meta2: string; meta3: string
    windowTitle: string
    welcomeName: string
    welcomeSub: string
    stats: {
      speed:   { label: string; value: string; sub: string }
      models:  { label: string; value: string; sub: string }
      formats: { label: string; value: string; sub: string }
      export:  { label: string; value: string; sub: string }
    }
    device: {
      name: string
      rename: string
      infoTitle: string
      rows: Array<[string, string]>
      rowsCompact: Array<[string, string]>
    }
  }
  logos: { label: string }
  pillars: {
    eyebrow: string; title: string; sub: string
    items: Array<{ icon: string; title: string; body: string }>
  }
  templates: {
    eyebrow: string; title: string; sub: string; windowTitle: string
    sidebar: Array<{ id: string; label: string; icon: string; count: string }>
    formats: string[]
    itemsLabel: string; filterLabel: string; sortLabel: string
  }
  uses: {
    eyebrow: string; title: string; sub: string
    biz: { chip: string; title: string; body: string; bullets: string[]; cta: string }
    perso: { chip: string; title: string; body: string; bullets: string[]; cta: string }
  }
  how: {
    eyebrow: string; title: string; sub: string
    steps: Array<{ n: string; title: string; body: string }>
  }
  pricing: {
    eyebrow: string; title: string; sub: string
    monthly: string; yearly: string; yearlyHint: string
    plans: Array<{
      name: string; price: string; unit: string; desc: string
      features: string[]; cta: string; highlight: boolean; badge?: string
    }>
  }
  reviews: {
    eyebrow: string; title: string; sub: string
    items: Array<{ name: string; role: string; body: string; rating: number }>
  }
  contact: {
    eyebrow: string; title: string; sub: string; formTitle: string
    name: string; namePh: string; email: string; emailPh: string
    topic: string; topicOptions: string[]
    message: string; messagePh: string
    send: string; sent: string; sentSub: string
    alt: { title: string; items: Array<{ icon: string; label: string; value: string }> }
    signin: { title: string; body: string; cta: string }
  }
  footer: {
    tagline: string
    cols: Array<{ title: string; items: string[] }>
    copyright: string; madeIn: string
  }
}

export const LANDING_CONTENT: Record<Lang, LandingContent> = {
  fr: {
    brand: "Studio Flyer AI",
    tagline: "Générateur IA de visuels publicitaires",
    nav: {
      home: "Accueil", templates: "Modèles", uses: "Cas d'usage",
      pricing: "Tarifs", reviews: "Avis", contact: "Contact",
    },
    cta: {
      launch: "Ouvrir l'app", tryFree: "Essayer gratuitement", bookDemo: "Demander une démo",
      seeTemplates: "Parcourir les modèles", start: "Commencer",
      signin: "Se connecter", signup: "Créer un compte", contact: "Nous contacter",
    },
    hero: {
      chip: "Nouveau — IA conversationnelle pour vos visuels",
      title: ["L'app qui crée vos visuels,", "guidée par l'IA,", "en quelques minutes."],
      subtitle:
        "Décrivez votre projet, importez votre logo, l'IA pose les bonnes questions et compose plusieurs visuels prêts à publier. Flyers, affiches, cartes de visite, posts réseaux sociaux — sans Photoshop, sans courbe d'apprentissage.",
      meta1: "Aucune carte requise",
      meta2: "Export HD illimité",
      meta3: "Annulez à tout moment",
      windowTitle: "Studio Flyer AI — Tableau de bord",
      welcomeName: "Bonjour, Camille",
      welcomeSub: "camille@studio-flyer.ai",
      stats: {
        speed:   { label: "Création moyenne", value: "4 min", sub: "du brief au visuel généré" },
        models:  { label: "Compositions", value: "12 480", sub: "templates IA professionnels" },
        formats: { label: "Formats", value: "38", sub: "imprimés et numériques" },
        export:  { label: "Export", value: "PDF · PNG · WebP", sub: "haute définition garantie" },
      },
      device: {
        name: "Espace de marque", rename: "Renommer", infoTitle: "Informations de l'espace",
        rows: [
          ["Plan actif", "Studio Flyer AI · Pro"],
          ["Marque", "Ambitech Dynamics"],
          ["Membres", "4 collaborateurs · 12 collaborations externes"],
          ["Polices", "Inter, Segoe UI Variable, Cascadia Mono"],
          ["Bibliothèque", "1 248 visuels générés · 86 marques"],
          ["Stockage", "12,4 Go sur 100 Go inclus"],
          ["Synchronisation", "Active — cloud Cloudinary (UE)"],
          ["Identifiant", "SFA-742B8D1C-2026"],
        ],
        rowsCompact: [
          ["Plan", "Studio · Pro"], ["Membres", "4 collaborateurs"],
          ["Stockage", "12,4 / 100 Go"], ["Cloud", "Cloudinary · UE"],
        ],
      },
    },
    logos: { label: "Ils créent leurs visuels avec Studio Flyer AI" },
    pillars: {
      eyebrow: "Pourquoi Studio Flyer AI",
      title: "Une IA conversationnelle,\nun studio complet.",
      sub: "Du premier brouillon au fichier imprimeur — pas une boîte à outils de plus, mais un studio piloté par IA qui pose les bonnes questions et livre des visuels cohérents en quelques minutes.",
      items: [
        { icon: "sparkle",   title: "IA conversationnelle",          body: "Décrivez votre besoin en français. L'IA pose les questions ciblées (objectif, public, format, couleurs) et compose un visuel cohérent en une passe." },
        { icon: "templates", title: "12 000+ compositions",          body: "Flyers, affiches, cartes, social media. Une bibliothèque structurée par usage — événement, promotion, identité, restauration — alimentée en continu." },
        { icon: "layers",    title: "Marques & équipes",             body: "Polices, couleurs, logos, contacts par marque. L'IA respecte automatiquement votre charte et reste cohérente même à plusieurs collaborateurs." },
        { icon: "cloud",     title: "Cloud chiffré en UE",           body: "Stockage Cloudinary, sauvegarde versionnée. Vos fichiers, gabarits et marques sont synchronisés en sécurité — conforme RGPD." },
      ],
    },
    templates: {
      eyebrow: "Bibliothèque",
      title: "12 480 compositions, classées par usage.",
      sub: "Parcourez par catégorie ou format. Cliquez pour démarrer un brief — l'IA s'inspire du modèle pour générer vos variantes.",
      windowTitle: "Modèles — Tous les formats",
      sidebar: [
        { id: "all",     label: "Tous les modèles",          icon: "grid",      count: "12 480" },
        { id: "flyers",  label: "Flyers & tracts",           icon: "templates", count: "3 240"  },
        { id: "posters", label: "Affiches",                  icon: "image",     count: "1 860"  },
        { id: "cards",   label: "Cartes de visite",          icon: "user",      count: "920"    },
        { id: "social",  label: "Réseaux sociaux",           icon: "share",     count: "4 100"  },
        { id: "cv",      label: "CV & lettres",              icon: "type",      count: "780"    },
        { id: "menus",   label: "Menus & cartes resto",      icon: "templates", count: "440"    },
        { id: "reports", label: "Rapports & présentations",  icon: "layers",    count: "1 140"  },
      ],
      formats: ["Tous", "A4", "Carré", "Story", "US Letter"],
      itemsLabel: "modèles", filterLabel: "Filtrer", sortLabel: "Trier",
    },
    uses: {
      eyebrow: "Pour qui", title: "Un studio IA. Deux façons de l'utiliser.",
      sub: "Que vous gériez une marque ou un projet personnel, l'app s'adapte à votre rythme.",
      biz: {
        chip: "Entreprises & marques",
        title: "Pour les équipes qui produisent vite, beaucoup, et avec cohérence.",
        body: "Centralisez vos marques, gabarits et visuels générés. Donnez accès à chaque équipe avec les bons droits. Multipliez la production sans perdre en cohérence de charte.",
        bullets: [
          "Espaces multi-marques avec droits granulaires",
          "Validation collaborative & commentaires",
          "Export multi-format en un clic",
          "Historique versionné de chaque visuel",
        ],
        cta: "Demander une démo",
      },
      perso: {
        chip: "Particuliers & indépendants",
        title: "Pour celles et ceux qui veulent un beau visuel, vite.",
        body: "Démarrez à partir d'un modèle ou d'une simple phrase. L'IA pose les bonnes questions, vous validez par chips cliquables, et exportez prêt à imprimer ou à partager.",
        bullets: [
          "Chat guidé — pas besoin de compétences design",
          "Édition par glisser-déposer, pas de Photoshop",
          "Export imprimeur (300 dpi, CMJN)",
          "Partage direct sur les réseaux sociaux",
        ],
        cta: "Commencer gratuitement",
      },
    },
    how: {
      eyebrow: "Comment ça marche", title: "Trois étapes. Pas plus.",
      sub: "De la première idée au fichier final, l'IA orchestre tout.",
      steps: [
        { n: "01", title: "Décrivez votre besoin",  body: "Importez votre logo et discutez avec l'IA en français. Elle pose des questions ciblées (objectif, public, message, couleurs) avec des choix cliquables." },
        { n: "02", title: "L'IA compose",            body: "Plusieurs agents IA spécialisés (planificateur, marque, design, prompt architect) génèrent des variantes cohérentes en 1 à 2 minutes." },
        { n: "03", title: "Exportez & partagez",     body: "PDF imprimeur, PNG ou WebP haute définition. Téléchargez, partagez sur les réseaux ou commandez l'impression." },
      ],
    },
    pricing: {
      eyebrow: "Tarifs", title: "Un abonnement par usage. Sans surprise.",
      sub: "Annulable à tout moment. Pas de frais cachés, pas de filigrane.",
      monthly: "Mensuel", yearly: "Annuel", yearlyHint: "− 20%",
      plans: [
        {
          name: "Découverte", price: "0", unit: "/ mois",
          desc: "Tout ce qu'il faut pour tester l'IA sur un projet personnel.",
          features: ["3 générations gratuites", "Export PNG basse définition", "2 marques personnelles", "Stockage 500 Mo"],
          cta: "Commencer", highlight: false,
        },
        {
          name: "Pro", price: "12", unit: "€ / mois",
          desc: "Pour les indépendants et petites équipes qui produisent souvent.",
          features: [
            "Générations illimitées", "Export PDF & PNG haute définition",
            "5 marques · 5 collaborateurs", "Stockage 100 Go", "Suppression de fond IA",
          ],
          cta: "Essayer 14 jours", highlight: true, badge: "Recommandé",
        },
        {
          name: "Studio", price: "32", unit: "€ / mois",
          desc: "Pour les marques et agences avec besoin d'échelle.",
          features: [
            "Tout le plan Pro", "Marques & collaborateurs illimités",
            "Validation & droits granulaires", "Stockage 1 To", "Support dédié & onboarding",
          ],
          cta: "Contacter l'équipe", highlight: false,
        },
      ],
    },
    reviews: {
      eyebrow: "Ils en parlent", title: "Des marques nous confient leurs visuels.",
      sub: "Le retour de quelques utilisateurs récents.",
      items: [
        { name: "Léa Martin",      role: "Responsable communication, Boulangerie Pétrin", body: "On a remplacé un graphiste freelance par Studio Flyer AI pour nos posts hebdo. La cohérence visuelle s'est même améliorée.", rating: 5 },
        { name: "Karim Benali",    role: "Fondateur, KB Coaching",                         body: "Je crée mes flyers le dimanche en 10 min via le chat IA. Avant je passais trois soirées sur Canva à corriger les détails.", rating: 5 },
        { name: "Émilie Rousseau", role: "Direction artistique, Studio Lumen",             body: "L'app gère nos 12 marques clients avec leurs chartes propres. Aucun de nos juniors n'a fait d'erreur de marque depuis le passage.", rating: 5 },
        { name: "Antoine Leroy",   role: "Restaurant Le Comptoir",                         body: "Les menus et les promos se génèrent en deux minutes. Je n'imagine plus repasser sur Word et imprimer en croisant les doigts.", rating: 5 },
      ],
    },
    contact: {
      eyebrow: "Parlons-en", title: "Une question ? Un projet ?",
      sub: "Choisissez le canal qui vous convient — on répond sous 24 h ouvrées.",
      formTitle: "Écrire à l'équipe",
      name: "Votre nom", namePh: "Camille Durand",
      email: "Email professionnel", emailPh: "camille@entreprise.fr",
      topic: "Sujet", topicOptions: ["Demande commerciale", "Support technique", "Partenariat", "Autre"],
      message: "Votre message", messagePh: "Parlez-nous de votre projet, vos volumes, votre marque…",
      send: "Envoyer le message", sent: "Message envoyé · merci !", sentSub: "On revient vers vous très vite.",
      alt: {
        title: "Autres canaux",
        items: [
          { icon: "mail",  label: "Email direct",          value: "hello@studio-flyer.ai" },
          { icon: "globe", label: "Documentation",         value: "docs.studio-flyer.ai" },
          { icon: "user",  label: "Programme partenaires", value: "Demander l'accès" },
        ],
      },
      signin: { title: "Déjà membre ?", body: "Reprenez vos projets là où vous les avez laissés.", cta: "Se connecter" },
    },
    footer: {
      tagline: "Le générateur IA de visuels publicitaires.",
      cols: [
        { title: "Produit",    items: ["Modèles", "Tarifs", "Cas d'usage", "Nouveautés", "Statut"] },
        { title: "Entreprise", items: ["À propos", "Carrières", "Presse", "Partenaires", "Contact"] },
        { title: "Ressources", items: ["Documentation", "Guides", "Communauté", "API", "Légal"] },
      ],
      copyright: "© 2026 Studio Flyer AI · Tous droits réservés.",
      madeIn: "Propulsé par Ambitech Dynamics · hébergé en UE",
    },
  },

  en: {
    brand: "Studio Flyer AI",
    tagline: "AI-powered ad visual generator",
    nav: { home: "Home", templates: "Templates", uses: "Use cases", pricing: "Pricing", reviews: "Reviews", contact: "Contact" },
    cta: {
      launch: "Open the app", tryFree: "Try for free", bookDemo: "Book a demo",
      seeTemplates: "Browse templates", start: "Get started",
      signin: "Sign in", signup: "Create account", contact: "Contact us",
    },
    hero: {
      chip: "New — Conversational AI for your visuals",
      title: ["The app that creates your visuals,", "guided by AI,", "in minutes."],
      subtitle:
        "Describe your project, upload your logo, the AI asks the right questions and composes ready-to-publish visuals. Flyers, posters, business cards, social posts — no Photoshop, no learning curve.",
      meta1: "No card required", meta2: "Unlimited HD exports", meta3: "Cancel anytime",
      windowTitle: "Studio Flyer AI — Dashboard",
      welcomeName: "Hello, Camille", welcomeSub: "camille@studio-flyer.ai",
      stats: {
        speed:   { label: "Avg. creation time", value: "4 min", sub: "from brief to generated visual" },
        models:  { label: "Compositions", value: "12,480", sub: "AI-ready templates" },
        formats: { label: "Formats", value: "38", sub: "print and digital" },
        export:  { label: "Export", value: "PDF · PNG · WebP", sub: "high definition guaranteed" },
      },
      device: {
        name: "Brand workspace", rename: "Rename", infoTitle: "Workspace information",
        rows: [
          ["Active plan", "Studio Flyer AI · Pro"],
          ["Brand", "Ambitech Dynamics"],
          ["Members", "4 teammates · 12 external collaborators"],
          ["Fonts", "Inter, Segoe UI Variable, Cascadia Mono"],
          ["Library", "1,248 generated visuals · 86 brands"],
          ["Storage", "12.4 GB of 100 GB included"],
          ["Sync", "Active — Cloudinary (EU)"],
          ["Workspace ID", "SFA-742B8D1C-2026"],
        ],
        rowsCompact: [
          ["Plan", "Studio · Pro"], ["Members", "4 teammates"],
          ["Storage", "12.4 / 100 GB"], ["Cloud", "Cloudinary · EU"],
        ],
      },
    },
    logos: { label: "Brands creating with Studio Flyer AI" },
    pillars: {
      eyebrow: "Why Studio Flyer AI",
      title: "Conversational AI,\na complete studio.",
      sub: "From rough draft to print-ready file — not yet another toolbox, but an AI-driven studio that asks the right questions and delivers coherent visuals in minutes.",
      items: [
        { icon: "sparkle",   title: "Conversational AI",          body: "Describe your need in plain language. The AI asks targeted questions (goal, audience, format, colors) and composes a coherent visual in one pass." },
        { icon: "templates", title: "12,000+ compositions",       body: "Flyers, posters, cards, social media. A library organised by use — event, promotion, identity, restaurant — kept up to date." },
        { icon: "layers",    title: "Brands & teams",             body: "Fonts, colors, logos and contacts per brand. The AI respects your brand guidelines automatically, even across collaborators." },
        { icon: "cloud",     title: "Encrypted EU cloud",         body: "Cloudinary storage, versioned backups. Your files, templates and brands sync securely — GDPR compliant." },
      ],
    },
    templates: {
      eyebrow: "Library", title: "12,480 compositions, organised by use.",
      sub: "Browse by category or format. Click to start a brief — the AI takes the template as inspiration and generates your variants.",
      windowTitle: "Templates — All formats",
      sidebar: [
        { id: "all",     label: "All templates",     icon: "grid",      count: "12,480" },
        { id: "flyers",  label: "Flyers & leaflets", icon: "templates", count: "3,240"  },
        { id: "posters", label: "Posters",           icon: "image",     count: "1,860"  },
        { id: "cards",   label: "Business cards",    icon: "user",      count: "920"    },
        { id: "social",  label: "Social media",      icon: "share",     count: "4,100"  },
        { id: "cv",      label: "Resumes & letters", icon: "type",      count: "780"    },
        { id: "menus",   label: "Menus & food cards", icon: "templates", count: "440"   },
        { id: "reports", label: "Reports & decks",   icon: "layers",    count: "1,140"  },
      ],
      formats: ["All", "A4", "Square", "Story", "US Letter"],
      itemsLabel: "templates", filterLabel: "Filter", sortLabel: "Sort",
    },
    uses: {
      eyebrow: "For whom", title: "One AI studio. Two ways to use it.",
      sub: "Whether you run a brand or a personal project, the app adapts to your pace.",
      biz: {
        chip: "Companies & brands",
        title: "For teams that produce fast, lots, and consistently.",
        body: "Centralise your brands, templates and generated visuals. Give the right access to the right team. Scale production without losing brand coherence.",
        bullets: [
          "Multi-brand workspaces with granular rights",
          "Collaborative approval & comments",
          "One-click multi-format export",
          "Versioned history of every visual",
        ],
        cta: "Book a demo",
      },
      perso: {
        chip: "Individuals & freelancers",
        title: "For people who want a nice visual, fast.",
        body: "Start from a template or a single sentence. The AI asks the right questions, you validate with clickable chips, and export ready to print or share.",
        bullets: [
          "Guided chat — no design skills required",
          "Drag-and-drop editing, no Photoshop",
          "Print-ready export (300 dpi, CMYK)",
          "Direct sharing on social platforms",
        ],
        cta: "Start for free",
      },
    },
    how: {
      eyebrow: "How it works", title: "Three steps. No more.",
      sub: "From first idea to final file, the AI orchestrates everything.",
      steps: [
        { n: "01", title: "Describe your need", body: "Upload your logo and chat with the AI. It asks targeted questions (goal, audience, message, colors) with clickable choices." },
        { n: "02", title: "AI composes",        body: "Several specialised AI agents (planner, brand, design, prompt architect) generate coherent variants in 1 to 2 minutes." },
        { n: "03", title: "Export & share",     body: "Print-ready PDF, high-def PNG or WebP. Download, share on social platforms or order print." },
      ],
    },
    pricing: {
      eyebrow: "Pricing", title: "One plan per use. No surprises.",
      sub: "Cancel anytime. No hidden fees, no watermark.",
      monthly: "Monthly", yearly: "Yearly", yearlyHint: "− 20%",
      plans: [
        {
          name: "Discover", price: "0", unit: "/ month",
          desc: "Everything to test the AI on a personal project.",
          features: ["3 free generations", "PNG low-res export", "2 personal brands", "500 MB storage"],
          cta: "Get started", highlight: false,
        },
        {
          name: "Pro", price: "12", unit: "€ / month",
          desc: "For freelancers and small teams that produce often.",
          features: [
            "Unlimited generations", "PDF & PNG high-def export",
            "5 brands · 5 members", "100 GB storage", "AI background removal",
          ],
          cta: "Try 14 days", highlight: true, badge: "Recommended",
        },
        {
          name: "Studio", price: "32", unit: "€ / month",
          desc: "For brands and agencies that need scale.",
          features: [
            "Everything in Pro", "Unlimited brands & members",
            "Approval & granular rights", "1 TB storage", "Dedicated support & onboarding",
          ],
          cta: "Contact the team", highlight: false,
        },
      ],
    },
    reviews: {
      eyebrow: "What they say", title: "Brands trust us with their visuals.",
      sub: "Recent feedback from real users.",
      items: [
        { name: "Léa Martin",      role: "Head of communication, Boulangerie Pétrin", body: "We replaced a freelance designer with Studio Flyer AI for our weekly posts. Brand coherence actually improved.", rating: 5 },
        { name: "Karim Benali",    role: "Founder, KB Coaching",                       body: "I make my flyers Sunday in 10 min via the chat AI. I used to spend three evenings on Canva fixing details.", rating: 5 },
        { name: "Émilie Rousseau", role: "Art director, Studio Lumen",                 body: "The app handles our 12 client brands with their own guidelines. None of our juniors made a brand mistake since the switch.", rating: 5 },
        { name: "Antoine Leroy",   role: "Restaurant Le Comptoir",                     body: "Menus and promos generate in two minutes. I can't imagine going back to Word and crossed fingers at the printer.", rating: 5 },
      ],
    },
    contact: {
      eyebrow: "Let's talk", title: "A question? A project?",
      sub: "Pick the channel you prefer — we reply within 24 business hours.",
      formTitle: "Write to the team",
      name: "Your name", namePh: "Camille Durand",
      email: "Work email", emailPh: "camille@company.com",
      topic: "Topic", topicOptions: ["Sales", "Technical support", "Partnership", "Other"],
      message: "Your message", messagePh: "Tell us about your project, volumes, brand…",
      send: "Send message", sent: "Message sent · thanks!", sentSub: "We'll get back to you very soon.",
      alt: {
        title: "Other channels",
        items: [
          { icon: "mail",  label: "Direct email",     value: "hello@studio-flyer.ai" },
          { icon: "globe", label: "Documentation",    value: "docs.studio-flyer.ai" },
          { icon: "user",  label: "Partner program",  value: "Request access" },
        ],
      },
      signin: { title: "Already a member?", body: "Pick up your projects where you left them.", cta: "Sign in" },
    },
    footer: {
      tagline: "The AI-powered ad visual generator.",
      cols: [
        { title: "Product",   items: ["Templates", "Pricing", "Use cases", "What's new", "Status"] },
        { title: "Company",   items: ["About", "Careers", "Press", "Partners", "Contact"] },
        { title: "Resources", items: ["Documentation", "Guides", "Community", "API", "Legal"] },
      ],
      copyright: "© 2026 Studio Flyer AI · All rights reserved.",
      madeIn: "Powered by Ambitech Dynamics · hosted in the EU",
    },
  },
}
