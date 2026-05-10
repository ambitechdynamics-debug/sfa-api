import type { IconName } from "@/components/ui/Icon"

export const VISUAL_TYPES: Array<{ value: string; label: string; desc: string; icon: IconName | string; ratio: string }> = [
  { value: "affiche",   label: "Affiche publicitaire", desc: "A4, A3, formats print",      icon: "image",    ratio: "3/4" },
  { value: "flyer",     label: "Flyer",                desc: "A5, A6, recto-verso",         icon: "layers",   ratio: "3/4" },
  { value: "story",     label: "Story Instagram",      desc: "Vertical 1080×1920",          icon: "rocket",   ratio: "9/16" },
  { value: "post-fb",   label: "Post Facebook",        desc: "Paysage 1200×630",            icon: "share",    ratio: "1.91/1" },
  { value: "banniere",  label: "Bannière web",         desc: "Site, e-commerce, header",    icon: "layout",   ratio: "16/9" },
  { value: "logo",      label: "Logo simple",          desc: "Mark + wordmark",             icon: "wand",     ratio: "1/1" },
  { value: "event",     label: "Visuel événementiel",  desc: "Concert, vernissage, salon",  icon: "calendar", ratio: "1/1" },
  { value: "menu",      label: "Menu restaurant",      desc: "Carte, ardoise, prix",        icon: "type",     ratio: "1080/1920" },
  { value: "couv",      label: "Couverture document",  desc: "Rapport, pitch deck",         icon: "folder",   ratio: "3/4" },
  { value: "autre",     label: "Autre / sur-mesure",   desc: "Vous décrivez le format",     icon: "more",     ratio: "1/1" },
]

export const VISUAL_STYLES: Array<{ value: string; label: string; desc: string }> = [
  { value: "moderne",        label: "Moderne",            desc: "Typographies fortes, espaces aérés" },
  { value: "luxe",           label: "Luxe",               desc: "Matières riches, sobriété élégante" },
  { value: "minimaliste",    label: "Minimaliste",        desc: "Peu d'éléments, beaucoup de respiration" },
  { value: "corporate",      label: "Corporate",          desc: "Sérieux, structuré, business" },
  { value: "africain",       label: "Africain moderne",   desc: "Motifs, terre, patterns wax" },
  { value: "jeune",          label: "Jeune & dynamique",  desc: "Couleurs vives, mouvement" },
  { value: "institutionnel", label: "Institutionnel",     desc: "Officiel, neutre, hiérarchisé" },
  { value: "evenementiel",   label: "Événementiel",       desc: "Impact, fête, urgence" },
  { value: "elegant",        label: "Élégant",            desc: "Serif, fines lignes, raffiné" },
  { value: "urbain",         label: "Urbain",             desc: "Street, contraste, halftone" },
  { value: "tech",           label: "Tech / IA",          desc: "Glow, gradients, futuriste" },
]

export const VISUAL_FORMATS: Array<{ value: string; label: string; size: string; icon: IconName | string; ratio: string }> = [
  { value: "1080",   label: "Carré",        size: "1080 × 1080",       icon: "grid",   ratio: "1/1" },
  { value: "story",  label: "Story",        size: "1080 × 1920",       icon: "rocket", ratio: "9/16" },
  { value: "a4",     label: "A4",           size: "210 × 297 mm",      icon: "type",   ratio: "210/297" },
  { value: "a5",     label: "A5",           size: "148 × 210 mm",      icon: "type",   ratio: "148/210" },
  { value: "banner", label: "Bannière web", size: "1920 × 1080",       icon: "layout", ratio: "16/9" },
  { value: "custom", label: "Personnalisé", size: "Vos dimensions",    icon: "edit",   ratio: "1/1" },
]

export const PRECISION_LEVELS: Array<{ value: string; label: string; desc: string }> = [
  { value: "free",   label: "Liberté créative",        desc: "L'IA propose librement à partir du brief" },
  { value: "guided", label: "Suivre mes instructions", desc: "Respecte les indications principales" },
  { value: "strict", label: "Respect strict",          desc: "Aucun écart sur les consignes données" },
  { value: "model",  label: "Reproduire un modèle",    desc: "À partir d'un visuel de référence" },
]

export const OBJECTIVES = ["Vendre", "Informer", "Annoncer", "Promouvoir", "Inviter"]

export const WIZARD_STEPS: Array<{ id: number; label: string; icon: IconName | string }> = [
  { id: 1, label: "Type",        icon: "layers" },
  { id: 2, label: "Informations", icon: "type" },
  { id: 3, label: "Style",       icon: "brush" },
  { id: 4, label: "Couleurs",    icon: "palette" },
  { id: 5, label: "Format",      icon: "layout" },
  { id: 6, label: "Précision",   icon: "wand" },
  { id: 7, label: "Résumé",      icon: "check" },
]

export interface WizardForm {
  type: string
  title: string
  brand: string
  description: string
  message: string
  secondary: string
  contact: string
  eventDate: string
  audience: string
  objective: string
  style: string[]
  colorsPref: string[]
  colorsAvoid: string[]
  format: string
  customW: number
  customH: number
  precision: string
  extraNotes: string
}

export const INITIAL_FORM: WizardForm = {
  type: "event",
  title: "",
  brand: "",
  description: "",
  message: "",
  secondary: "",
  contact: "",
  eventDate: "",
  audience: "",
  objective: "Annoncer",
  style: ["elegant"],
  colorsPref: ["#c66a45", "#1a0e08", "#f4ecd8"],
  colorsAvoid: [],
  format: "1080",
  customW: 1080,
  customH: 1080,
  precision: "guided",
  extraNotes: "",
}
