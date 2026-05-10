// mock-data.jsx — fake projects, generations, plans, etc.

const MOCK_USER = {
  name: "Amélie Bonnet",
  email: "amelie@studio-rond.fr",
  initials: "AB",
  plan: "Pro",
  credits: 87,
  creditsTotal: 100,
};

const MOCK_PROJECTS = [
  {
    id: "p_01",
    title: "Soirée After Work — Mai",
    type: "Affiche événement",
    typeIcon: "calendar",
    status: "validé",
    statusTone: "sage",
    updatedAt: "il y a 2 h",
    poster: { kind: "editorial", brief: { title: "Soirée\nAfter Work", date: "Vendredi 12 Mai", venue: "Le Loft · Paris 10", brand: "EVENTLAB" } },
    versions: 4,
  },
  {
    id: "p_02",
    title: "Brunch dominical · Maison Café",
    type: "Story Instagram",
    typeIcon: "image",
    status: "en cours",
    statusTone: "acc",
    updatedAt: "il y a 4 h",
    poster: { kind: "menu", brief: { title: "Brunch\nDominical", price: "18€", brand: "MAISON CAFÉ" } },
    versions: 2,
  },
  {
    id: "p_03",
    title: "Drop Été '25 — Marea",
    type: "Story Instagram",
    typeIcon: "image",
    status: "validé",
    statusTone: "sage",
    updatedAt: "hier",
    poster: { kind: "launch", brief: { title: "Drop\nÉté '25", subtitle: "Nouvelle collection", brand: "MAREA" } },
    versions: 6,
  },
  {
    id: "p_04",
    title: "Soldes -40% Boutique 22",
    type: "Affiche publicitaire",
    typeIcon: "tag",
    status: "retouche demandée",
    statusTone: "gold",
    updatedAt: "hier",
    poster: { kind: "sale", brief: { percent: "40", brand: "BOUTIQUE 22" } },
    versions: 3,
  },
  {
    id: "p_05",
    title: "Lancement produit — North Labs",
    type: "Bannière web",
    typeIcon: "layout",
    status: "brouillon",
    statusTone: "neutral",
    updatedAt: "il y a 3 j",
    poster: { kind: "corp", brief: { title: "Lancement\nProduit", date: "Q3 2025", brand: "NORTH LABS" } },
    versions: 1,
  },
  {
    id: "p_06",
    title: "Live Session — Mara & The Waves",
    type: "Affiche événement",
    typeIcon: "calendar",
    status: "généré",
    statusTone: "plum",
    updatedAt: "il y a 4 j",
    poster: { kind: "music", brief: { title: "Live\nSession", artist: "MARA & THE WAVES", date: "23.06", venue: "La Bellevilloise" } },
    versions: 2,
  },
];

const VISUAL_TYPES = [
  { value: "affiche",   label: "Affiche publicitaire", desc: "A4, A3, formats print",      icon: "image",    ratio: "3/4"     },
  { value: "flyer",     label: "Flyer",                desc: "A5, A6, recto-verso",         icon: "layers",   ratio: "3/4"     },
  { value: "story",     label: "Story Instagram",      desc: "Format vertical 1080×1920",   icon: "rocket",   ratio: "9/16"    },
  { value: "post-fb",   label: "Post Facebook",        desc: "Format paysage 1200×630",     icon: "share",    ratio: "1.91/1"  },
  { value: "banniere",  label: "Bannière web",         desc: "Site, e-commerce, header",    icon: "layout",   ratio: "16/9"    },
  { value: "logo",      label: "Logo simple",          desc: "Mark + wordmark",             icon: "wand",     ratio: "1/1"     },
  { value: "event",     label: "Visuel événementiel",  desc: "Concert, vernissage, salon",  icon: "calendar", ratio: "1/1"     },
  { value: "menu",      label: "Menu restaurant",      desc: "Carte, ardoise, prix",        icon: "type",     ratio: "1080/1920" },
  { value: "couv",      label: "Couverture document",  desc: "Rapport, pitch deck",         icon: "folder",   ratio: "3/4"     },
  { value: "autre",     label: "Autre / sur-mesure",   desc: "Vous décrivez le format",     icon: "more",     ratio: "1/1"     },
];

const VISUAL_STYLES = [
  { value: "moderne",        label: "Moderne",            desc: "Typographies fortes, espaces aérés" },
  { value: "luxe",           label: "Luxe",               desc: "Matières riches, sobriété élégante" },
  { value: "minimaliste",    label: "Minimaliste",        desc: "Peu d'éléments, très de respiration" },
  { value: "corporate",      label: "Corporate",          desc: "Sérieux, structuré, business" },
  { value: "africain",       label: "Africain moderne",   desc: "Motifs, terre, patterns wax" },
  { value: "jeune",          label: "Jeune & dynamique",  desc: "Couleurs vives, mouvement" },
  { value: "institutionnel", label: "Institutionnel",     desc: "Officiel, neutre, hiérarchisé" },
  { value: "evenementiel",   label: "Événementiel",       desc: "Impact, fête, urgence" },
  { value: "elegant",        label: "Élégant",            desc: "Serif, fines lignes, raffiné" },
  { value: "urbain",         label: "Urbain",             desc: "Street, contraste, halftone" },
  { value: "tech",           label: "Tech / IA",          desc: "Glow, gradients, futuriste" },
];

const VISUAL_FORMATS = [
  { value: "1080",   label: "Carré",        size: "1080 × 1080", icon: "grid",   ratio: "1/1"   },
  { value: "story",  label: "Story",        size: "1080 × 1920", icon: "rocket", ratio: "9/16"  },
  { value: "a4",     label: "A4",           size: "210 × 297 mm", icon: "type",  ratio: "210/297" },
  { value: "a5",     label: "A5",           size: "148 × 210 mm", icon: "type",  ratio: "148/210" },
  { value: "banner", label: "Bannière web", size: "1920 × 1080", icon: "layout", ratio: "16/9"  },
  { value: "custom", label: "Personnalisé", size: "Vos dimensions", icon: "edit", ratio: "1/1" },
];

const PRECISION_LEVELS = [
  { value: "free",    label: "Liberté créative",       desc: "L'IA propose librement à partir du brief" },
  { value: "guided",  label: "Suivre mes instructions", desc: "Respecte les indications principales"  },
  { value: "strict",  label: "Respect strict",          desc: "Aucun écart sur les consignes données" },
  { value: "model",   label: "Reproduire un modèle",    desc: "À partir d'un visuel de référence"     },
];

const OBJECTIVES = ["Vendre", "Informer", "Annoncer", "Promouvoir", "Inviter"];
const ACCOUNT_TYPES = [
  { value: "particulier", label: "Particulier", icon: "user" },
  { value: "entreprise",  label: "Entreprise",  icon: "folder" },
  { value: "agence",      label: "Agence",      icon: "layers" },
];

const PLANS = [
  {
    id: "free", name: "Découverte", price: "0", period: "€/mois",
    desc: "Pour tester l'outil",
    features: ["3 générations / mois", "Formats web", "Filigrane Studio Flyer", "Export PNG"],
    cta: "Commencer", current: false,
  },
  {
    id: "starter", name: "Starter", price: "19", period: "€/mois",
    desc: "Pour les indépendants",
    features: ["20 générations / mois", "Tous les formats", "Sans filigrane", "Export HD PNG, PDF, JPEG", "Historique 30 jours"],
    cta: "Choisir Starter", current: false,
  },
  {
    id: "pro", name: "Pro", price: "49", period: "€/mois",
    desc: "Pour les pros & créateurs",
    features: ["100 générations / mois", "Retouches illimitées", "Mémoires de marque", "Export tous formats", "Historique illimité", "Support prioritaire"],
    cta: "Plan actuel", current: true, featured: true,
  },
  {
    id: "business", name: "Business", price: "129", period: "€/mois",
    desc: "Pour les agences",
    features: ["Générations illimitées", "Multi-marques (jusqu'à 10)", "API d'intégration", "Branding agence", "Account manager dédié", "Onboarding sur-mesure"],
    cta: "Passer à Business", current: false,
  },
];

const NOTIFICATIONS = [
  { id: "n1", title: "Génération terminée", body: "Votre visuel « Drop Été '25 » est prêt.", time: "il y a 8 min", unread: true, icon: "sparkles", tone: "acc" },
  { id: "n2", title: "Retouche envoyée", body: "L'IA a appliqué vos remarques sur Soldes -40%.", time: "il y a 1 h", unread: true, icon: "wand", tone: "plum" },
  { id: "n3", title: "Crédits ajoutés", body: "+50 crédits IA ont été ajoutés à votre compte.", time: "hier", unread: false, icon: "credit", tone: "sage" },
  { id: "n4", title: "Nouvelle fonctionnalité", body: "Les mémoires de marque sont disponibles.", time: "il y a 3 j", unread: false, icon: "rocket", tone: "gold" },
];

const FAQ = [
  { q: "Comment fonctionne la génération par IA ?", a: "Vous remplissez un brief en quelques étapes (type, message, style, couleurs, format). Notre IA combine ces informations avec vos préférences de marque pour produire 4 propositions de visuels en moins d'une minute. Vous pouvez ensuite demander des retouches en langage naturel." },
  { q: "Mes visuels sont-ils libres de droits ?", a: "Oui, tous les visuels générés via votre abonnement vous appartiennent et sont utilisables commercialement sans restriction, y compris pour de l'impression grand format ou de la publicité payante." },
  { q: "Puis-je importer ma charte graphique ?", a: "Bien sûr. Importez votre logo, vos couleurs principales, vos polices et vos exemples de visuels. L'IA mémorise votre identité et l'applique à chaque génération. C'est notre fonction Mémoires de marque (plans Pro et Business)." },
  { q: "Comment se passent les retouches ?", a: "Sur chaque proposition, vous pouvez décrire en quelques mots ce que vous souhaitez changer (« plus chaleureux », « ajouter le logo en haut à droite », « remplacer le bleu par du terracotta »). L'IA régénère une nouvelle version en gardant la composition." },
  { q: "Puis-je annuler mon abonnement ?", a: "À tout moment, depuis la page Abonnement. Aucun engagement, aucun frais d'annulation. Vos visuels créés restent accessibles dans votre historique." },
  { q: "Quels formats d'export sont disponibles ?", a: "PNG haute résolution, PDF print (CMJN, 300 DPI), JPEG web et SVG (selon le type de visuel). Les formats sont disponibles dès le plan Starter." },
];

const TIMELINE_EVENTS = [
  { id: "t1", at: "il y a 2 min",  who: "IA", what: "a généré 4 variantes",      icon: "sparkles", tone: "acc" },
  { id: "t2", at: "il y a 4 min",  who: "Vous", what: "avez envoyé le brief",   icon: "send",     tone: "neutral" },
  { id: "t3", at: "il y a 18 min", who: "IA", what: "a appliqué vos retouches", icon: "wand",     tone: "plum" },
  { id: "t4", at: "il y a 22 min", who: "Vous", what: "avez demandé : « plus chaleureux »", icon: "edit", tone: "gold" },
  { id: "t5", at: "il y a 1 h",    who: "IA", what: "a généré la version initiale", icon: "sparkles", tone: "acc" },
];

Object.assign(window, {
  MOCK_USER, MOCK_PROJECTS, VISUAL_TYPES, VISUAL_STYLES, VISUAL_FORMATS,
  PRECISION_LEVELS, OBJECTIVES, ACCOUNT_TYPES, PLANS, NOTIFICATIONS, FAQ, TIMELINE_EVENTS,
});
