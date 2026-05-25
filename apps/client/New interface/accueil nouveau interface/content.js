// content.js — i18n (FR / EN)
// Plain JS object; attached to window for global access.

const CONTENT = {
  fr: {
    brand: "Consilium Design",
    tagline: "Studio de design assisté",
    nav: {
      home: "Accueil",
      templates: "Modèles",
      uses: "Cas d'usage",
      pricing: "Tarifs",
      reviews: "Avis",
      contact: "Contact",
    },
    cta: {
      launch: "Ouvrir l'app",
      tryFree: "Essayer gratuitement",
      bookDemo: "Demander une démo",
      seeTemplates: "Parcourir les modèles",
      start: "Commencer",
      signin: "Se connecter",
      signup: "Créer un compte",
      contact: "Nous contacter",
    },

    hero: {
      chip: "Nouveau — Génération IA pour visuels",
      title: ["Le studio de design", "qui s'installe", "comme une app."],
      subtitle:
        "Créez flyers, affiches, cartes et visuels réseaux sociaux dans une interface familière, pensée pour les pros comme pour les particuliers. Pas de courbe d'apprentissage — vous savez déjà vous en servir.",
      meta1: "Aucune carte requise",
      meta2: "Export HD illimité",
      meta3: "Annulez à tout moment",
      windowTitle: "Consilium Design — Tableau de bord",
      welcomeName: "Bonjour, Camille",
      welcomeSub: "ambitech@consilium.studio",
      stats: {
        speed: { label: "Création moyenne", value: "4 min", sub: "du brief à l'export final" },
        models: { label: "Modèles", value: "12 480", sub: "templates professionnels" },
        formats: { label: "Formats", value: "38", sub: "imprimés et numériques" },
        export: { label: "Export", value: "PDF · PNG · SVG", sub: "haute définition garantie" },
      },
      device: {
        name: "Espace personnel",
        rename: "Renommer",
        infoTitle: "Informations sur l'espace",
        rows: [
          ["Plan actif", "Consilium Studio · Pro"],
          ["Marque", "Ambitech Dynamics"],
          ["Membres", "4 collaborateurs · 12 collaborations externes"],
          ["Polices installées", "Inter, Söhne, Segoe UI Variable, Cascadia Mono"],
          ["Bibliothèque", "1 248 visuels · 86 marques"],
          ["Stockage", "12,4 Go sur 100 Go inclus"],
          ["Synchronisation", "Active — cloud chiffré (UE)"],
          ["Identifiant", "CSL-742B8D1C-2026"],
        ],
        rowsCompact: [
          ["Plan", "Studio · Pro"],
          ["Membres", "4 collaborateurs"],
          ["Stockage", "12,4 / 100 Go"],
          ["Cloud", "Chiffré · UE"],
        ],
      },
    },

    logos: {
      label: "Ils créent leurs visuels avec Consilium",
    },

    pillars: {
      eyebrow: "Pourquoi Consilium",
      title: "L'interface que vous connaissez,\nla puissance d'un studio.",
      sub: "Tout ce dont vous avez besoin pour créer, du premier brouillon à l'impression — pensé comme un système d'exploitation, pas comme une boîte à outils.",
      items: [
        {
          icon: "sparkle",
          title: "Génération assistée par IA",
          body: "Décrivez votre besoin, l'éditeur propose des compositions cohérentes que vous affinez en un clic.",
        },
        {
          icon: "templates",
          title: "12 000+ modèles éditables",
          body: "Une bibliothèque structurée par usage — événement, promotion, identité, RH — toujours à jour.",
        },
        {
          icon: "layers",
          title: "Marques & équipes",
          body: "Polices, couleurs, logos et gabarits par marque. Les visuels restent cohérents même à plusieurs.",
        },
        {
          icon: "cloud",
          title: "Cloud chiffré en UE",
          body: "Vos fichiers, gabarits et marques synchronisés en sécurité. Versionnés, jamais perdus.",
        },
      ],
    },

    templates: {
      eyebrow: "Bibliothèque",
      title: "12 480 modèles, classés comme dans l'Explorateur.",
      sub: "Parcourez par usage et par format. Cliquez, éditez, exportez — sans quitter l'app.",
      windowTitle: "Modèles — Tous les formats",
      sidebar: [
        { id: "all", label: "Tous les modèles", icon: "grid", count: "12 480" },
        { id: "flyers", label: "Flyers & tracts", icon: "templates", count: "3 240" },
        { id: "posters", label: "Affiches", icon: "image", count: "1 860" },
        { id: "cards", label: "Cartes de visite", icon: "user", count: "920" },
        { id: "social", label: "Réseaux sociaux", icon: "share", count: "4 100" },
        { id: "cv", label: "CV & lettres", icon: "type", count: "780" },
        { id: "menus", label: "Menus & cartes", icon: "templates", count: "440" },
        { id: "reports", label: "Rapports & présentations", icon: "layers", count: "1 140" },
      ],
      formats: ["Tous", "A4", "Carré", "Story", "US Letter"],
      itemsLabel: "modèles",
      filterLabel: "Filtrer",
      sortLabel: "Trier",
    },

    uses: {
      eyebrow: "Pour qui",
      title: "Un studio. Deux façons de l'utiliser.",
      sub: "Que vous gériez une marque ou un projet personnel, l'app s'adapte à vos besoins.",
      biz: {
        chip: "Entreprises & marques",
        title: "Pour les équipes qui produisent vite, beaucoup, et bien.",
        body: "Centralisez vos gabarits, vos marques, vos visuels. Donnez accès à chaque équipe avec les bons droits. Multipliez votre production sans perdre en cohérence.",
        bullets: [
          "Espaces multi-marques avec droits granulaires",
          "Validation collaborative & commentaires",
          "Export multi-format programmé",
          "Statistiques de production en temps réel",
        ],
        cta: "Demander une démo",
      },
      perso: {
        chip: "Particuliers & indépendants",
        title: "Pour celles et ceux qui veulent un beau visuel, vite.",
        body: "Démarrez à partir d'un modèle, personnalisez sans compétence de design, exportez prêt à imprimer ou à partager. Ce dont vous avez besoin, sans le superflu.",
        bullets: [
          "Modèles prêts à l'emploi par occasion",
          "Édition simplifiée — pas de Photoshop",
          "Export imprimeur (300 dpi, CMJN)",
          "Partage direct sur les réseaux",
        ],
        cta: "Commencer gratuitement",
      },
    },

    how: {
      eyebrow: "Comment ça marche",
      title: "Trois étapes. Pas plus.",
      sub: "De l'inspiration au fichier final, sans détour.",
      steps: [
        {
          n: "01",
          title: "Choisissez un modèle",
          body: "Parcourez la bibliothèque par usage ou format, ou démarrez à partir d'une description.",
        },
        {
          n: "02",
          title: "Personnalisez",
          body: "Modifiez textes, couleurs, photos et logo en glisser-déposer. La marque s'applique d'un clic.",
        },
        {
          n: "03",
          title: "Exportez & partagez",
          body: "PDF imprimeur, PNG haute définition ou export direct sur vos réseaux. C'est prêt.",
        },
      ],
    },

    pricing: {
      eyebrow: "Tarifs",
      title: "Un abonnement par usage. Sans surprise.",
      sub: "Annulable à tout moment. Pas de frais cachés, pas de filigrane.",
      monthly: "Mensuel",
      yearly: "Annuel",
      yearlyHint: "− 20%",
      plans: [
        {
          name: "Découverte",
          price: "0",
          unit: "/ mois",
          desc: "Tout ce qu'il faut pour démarrer un projet personnel.",
          features: [
            "300 modèles gratuits",
            "Export PNG basse définition",
            "2 marques personnelles",
            "Stockage 500 Mo",
          ],
          cta: "Commencer",
          highlight: false,
        },
        {
          name: "Pro",
          price: "12",
          unit: "€ / mois",
          desc: "Pour les indépendants et petites équipes qui produisent souvent.",
          features: [
            "Bibliothèque complète",
            "Export PDF & PNG haute définition",
            "5 marques · 5 collaborateurs",
            "Stockage 100 Go",
            "Suppression de fond IA",
          ],
          cta: "Essayer 14 jours",
          highlight: true,
          badge: "Recommandé",
        },
        {
          name: "Studio",
          price: "32",
          unit: "€ / mois",
          desc: "Pour les marques et agences avec besoin d'échelle.",
          features: [
            "Tout le plan Pro",
            "Marques & collaborateurs illimités",
            "Validation & droits granulaires",
            "Stockage 1 To",
            "Support dédié & onboarding",
          ],
          cta: "Contacter l'équipe",
          highlight: false,
        },
      ],
    },

    reviews: {
      eyebrow: "Ils en parlent",
      title: "4 200 marques nous confient leurs visuels.",
      sub: "Le retour de quelques utilisateurs récents.",
      items: [
        {
          name: "Léa Martin",
          role: "Responsable communication, Boulangerie Pétrin",
          body: "On a remplacé un graphiste freelance par Consilium pour nos posts hebdo. La cohérence visuelle s'est même améliorée.",
          rating: 5,
        },
        {
          name: "Karim Benali",
          role: "Fondateur, KB Coaching",
          body: "Je crée mes flyers le dimanche en 10 min. Avant je passais trois soirées sur Canva à corriger les détails.",
          rating: 5,
        },
        {
          name: "Émilie Rousseau",
          role: "Direction artistique, Studio Lumen",
          body: "L'app gère nos 12 marques clients avec des règles propres. Aucun de nos juniors n'a fait d'erreur de charte depuis le passage.",
          rating: 5,
        },
        {
          name: "Antoine Leroy",
          role: "Restaurant Le Comptoir",
          body: "Les menus se mettent à jour en deux minutes. Je n'imagine plus repasser sur Word et imprimer en croisant les doigts.",
          rating: 5,
        },
      ],
    },

    contact: {
      eyebrow: "Parlons-en",
      title: "Une question ? Un projet ?",
      sub: "Choisissez le canal qui vous convient — on répond sous 24 h ouvrées.",
      formTitle: "Écrire à l'équipe",
      name: "Votre nom",
      namePh: "Camille Durand",
      email: "Email professionnel",
      emailPh: "camille@entreprise.fr",
      topic: "Sujet",
      topicOptions: ["Demande commerciale", "Support technique", "Partenariat", "Autre"],
      message: "Votre message",
      messagePh: "Parlez-nous de votre projet, vos volumes, votre marque…",
      send: "Envoyer le message",
      sent: "Message envoyé · merci !",
      sentSub: "On revient vers vous très vite.",
      alt: {
        title: "Autres canaux",
        items: [
          { icon: "mail", label: "Email direct", value: "hello@consilium.design" },
          { icon: "globe", label: "Documentation", value: "docs.consilium.design" },
          { icon: "user", label: "Programme partenaires", value: "Demander l'accès" },
        ],
      },
      signin: {
        title: "Déjà membre ?",
        body: "Reprenez vos projets là où vous les avez laissés.",
        cta: "Se connecter",
      },
    },

    footer: {
      tagline: "Le studio de design qui s'utilise comme une app.",
      cols: [
        { title: "Produit", items: ["Modèles", "Tarifs", "Cas d'usage", "Nouveautés", "Statut"] },
        { title: "Entreprise", items: ["À propos", "Carrières", "Presse", "Partenaires", "Contact"] },
        { title: "Ressources", items: ["Documentation", "Guides", "Communauté", "API", "Légal"] },
      ],
      copyright: "© 2026 Consilium Design SAS · Tous droits réservés.",
      madeIn: "Conçu en France · hébergé en UE",
    },
  },

  en: {
    brand: "Consilium Design",
    tagline: "Assisted design studio",
    nav: {
      home: "Home",
      templates: "Templates",
      uses: "Use cases",
      pricing: "Pricing",
      reviews: "Reviews",
      contact: "Contact",
    },
    cta: {
      launch: "Open the app",
      tryFree: "Try for free",
      bookDemo: "Book a demo",
      seeTemplates: "Browse templates",
      start: "Get started",
      signin: "Sign in",
      signup: "Create account",
      contact: "Contact us",
    },

    hero: {
      chip: "New — AI generation for visuals",
      title: ["The design studio", "that installs", "like an app."],
      subtitle:
        "Create flyers, posters, business cards and social visuals in a familiar interface built for both professionals and individuals. No learning curve — you already know how to use it.",
      meta1: "No card required",
      meta2: "Unlimited HD exports",
      meta3: "Cancel anytime",
      windowTitle: "Consilium Design — Dashboard",
      welcomeName: "Hello, Camille",
      welcomeSub: "ambitech@consilium.studio",
      stats: {
        speed: { label: "Avg. creation time", value: "4 min", sub: "from brief to export" },
        models: { label: "Templates", value: "12,480", sub: "professional layouts" },
        formats: { label: "Formats", value: "38", sub: "print and digital" },
        export: { label: "Export", value: "PDF · PNG · SVG", sub: "high definition" },
      },
      device: {
        name: "Personal workspace",
        rename: "Rename",
        infoTitle: "Workspace information",
        rows: [
          ["Active plan", "Consilium Studio · Pro"],
          ["Brand", "Ambitech Dynamics"],
          ["Members", "4 teammates · 12 external collaborators"],
          ["Installed fonts", "Inter, Söhne, Segoe UI Variable, Cascadia Mono"],
          ["Library", "1,248 visuals · 86 brands"],
          ["Storage", "12.4 GB of 100 GB included"],
          ["Sync", "Active — encrypted cloud (EU)"],
          ["Workspace ID", "CSL-742B8D1C-2026"],
        ],
        rowsCompact: [
          ["Plan", "Studio · Pro"],
          ["Members", "4 teammates"],
          ["Storage", "12.4 / 100 GB"],
          ["Cloud", "Encrypted · EU"],
        ],
      },
    },

    logos: { label: "Brands creating with Consilium" },

    pillars: {
      eyebrow: "Why Consilium",
      title: "The interface you know,\nthe power of a studio.",
      sub: "Everything you need to create, from rough draft to print — built like an operating system, not a toolbox.",
      items: [
        { icon: "sparkle", title: "AI-assisted generation", body: "Describe your need, the editor proposes coherent compositions you refine in one click." },
        { icon: "templates", title: "12,000+ editable templates", body: "A library organised by use — event, promotion, identity, HR — always up to date." },
        { icon: "layers", title: "Brands & teams", body: "Fonts, colors, logos and templates per brand. Visuals stay coherent even across teams." },
        { icon: "cloud", title: "Encrypted EU cloud", body: "Your files, templates and brands synced securely. Versioned, never lost." },
      ],
    },

    templates: {
      eyebrow: "Library",
      title: "12,480 templates, organised like File Explorer.",
      sub: "Browse by use and format. Click, edit, export — without leaving the app.",
      windowTitle: "Templates — All formats",
      sidebar: [
        { id: "all", label: "All templates", icon: "grid", count: "12,480" },
        { id: "flyers", label: "Flyers & leaflets", icon: "templates", count: "3,240" },
        { id: "posters", label: "Posters", icon: "image", count: "1,860" },
        { id: "cards", label: "Business cards", icon: "user", count: "920" },
        { id: "social", label: "Social media", icon: "share", count: "4,100" },
        { id: "cv", label: "Resumes & letters", icon: "type", count: "780" },
        { id: "menus", label: "Menus & cards", icon: "templates", count: "440" },
        { id: "reports", label: "Reports & decks", icon: "layers", count: "1,140" },
      ],
      formats: ["All", "A4", "Square", "Story", "US Letter"],
      itemsLabel: "templates",
      filterLabel: "Filter",
      sortLabel: "Sort",
    },

    uses: {
      eyebrow: "For whom",
      title: "One studio. Two ways to use it.",
      sub: "Whether you run a brand or a personal project, the app adapts.",
      biz: {
        chip: "Companies & brands",
        title: "For teams that produce fast, lots, and well.",
        body: "Centralise your templates, brands and visuals. Give the right access to the right team. Scale production without losing coherence.",
        bullets: [
          "Multi-brand workspaces with granular rights",
          "Collaborative approval & comments",
          "Scheduled multi-format export",
          "Real-time production analytics",
        ],
        cta: "Book a demo",
      },
      perso: {
        chip: "Individuals & freelancers",
        title: "For people who want a nice visual, fast.",
        body: "Start from a template, customise without design skills, export ready to print or share. What you need, without the rest.",
        bullets: [
          "Ready-to-use templates by occasion",
          "Simple editing — no Photoshop",
          "Print-ready export (300 dpi, CMYK)",
          "Direct sharing on social platforms",
        ],
        cta: "Start for free",
      },
    },

    how: {
      eyebrow: "How it works",
      title: "Three steps. No more.",
      sub: "From inspiration to final file, no detour.",
      steps: [
        { n: "01", title: "Pick a template", body: "Browse the library by use or format, or start from a description." },
        { n: "02", title: "Customise", body: "Edit text, colors, photos and logo by drag and drop. Brand applies in one click." },
        { n: "03", title: "Export & share", body: "Print-ready PDF, high-def PNG or direct export to your socials. It's done." },
      ],
    },

    pricing: {
      eyebrow: "Pricing",
      title: "One plan per use. No surprises.",
      sub: "Cancel anytime. No hidden fees, no watermark.",
      monthly: "Monthly",
      yearly: "Yearly",
      yearlyHint: "− 20%",
      plans: [
        {
          name: "Discover",
          price: "0",
          unit: "/ month",
          desc: "Everything to kick off a personal project.",
          features: ["300 free templates", "PNG low-res export", "2 personal brands", "500 MB storage"],
          cta: "Get started",
          highlight: false,
        },
        {
          name: "Pro",
          price: "12",
          unit: "€ / month",
          desc: "For freelancers and small teams that produce often.",
          features: [
            "Full template library",
            "PDF & PNG high-def export",
            "5 brands · 5 members",
            "100 GB storage",
            "AI background removal",
          ],
          cta: "Try 14 days",
          highlight: true,
          badge: "Recommended",
        },
        {
          name: "Studio",
          price: "32",
          unit: "€ / month",
          desc: "For brands and agencies that need scale.",
          features: [
            "Everything in Pro",
            "Unlimited brands & members",
            "Approval & granular rights",
            "1 TB storage",
            "Dedicated support & onboarding",
          ],
          cta: "Contact the team",
          highlight: false,
        },
      ],
    },

    reviews: {
      eyebrow: "What they say",
      title: "4,200 brands trust us with their visuals.",
      sub: "Recent feedback from real users.",
      items: [
        { name: "Léa Martin", role: "Head of communication, Boulangerie Pétrin", body: "We replaced a freelance designer with Consilium for our weekly posts. Brand coherence actually improved.", rating: 5 },
        { name: "Karim Benali", role: "Founder, KB Coaching", body: "I make my flyers Sunday in 10 min. I used to spend three evenings on Canva fixing details.", rating: 5 },
        { name: "Émilie Rousseau", role: "Art director, Studio Lumen", body: "The app handles our 12 client brands with their own rules. None of our juniors made a brand mistake since the switch.", rating: 5 },
        { name: "Antoine Leroy", role: "Restaurant Le Comptoir", body: "Menus update in two minutes. I can't imagine going back to Word and crossed fingers at the printer.", rating: 5 },
      ],
    },

    contact: {
      eyebrow: "Let's talk",
      title: "A question? A project?",
      sub: "Pick the channel you prefer — we reply within 24 business hours.",
      formTitle: "Write to the team",
      name: "Your name",
      namePh: "Camille Durand",
      email: "Work email",
      emailPh: "camille@company.com",
      topic: "Topic",
      topicOptions: ["Sales", "Technical support", "Partnership", "Other"],
      message: "Your message",
      messagePh: "Tell us about your project, volumes, brand…",
      send: "Send message",
      sent: "Message sent · thanks!",
      sentSub: "We'll get back to you very soon.",
      alt: {
        title: "Other channels",
        items: [
          { icon: "mail", label: "Direct email", value: "hello@consilium.design" },
          { icon: "globe", label: "Documentation", value: "docs.consilium.design" },
          { icon: "user", label: "Partner program", value: "Request access" },
        ],
      },
      signin: { title: "Already a member?", body: "Pick up your projects where you left them.", cta: "Sign in" },
    },

    footer: {
      tagline: "The design studio that works like an app.",
      cols: [
        { title: "Product", items: ["Templates", "Pricing", "Use cases", "What's new", "Status"] },
        { title: "Company", items: ["About", "Careers", "Press", "Partners", "Contact"] },
        { title: "Resources", items: ["Documentation", "Guides", "Community", "API", "Legal"] },
      ],
      copyright: "© 2026 Consilium Design SAS · All rights reserved.",
      madeIn: "Made in France · hosted in the EU",
    },
  },
};

window.CONTENT = CONTENT;
