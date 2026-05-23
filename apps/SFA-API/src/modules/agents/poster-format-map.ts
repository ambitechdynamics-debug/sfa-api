/**
 * Mapping canonique type de visuel → ratios + résolutions recommandés.
 *
 * Source de vérité unique partagée par :
 *   - les system prompts agents (Planner / PromptArchitect / Generator) via
 *     `formatPosterTypeReferenceBlock()` qui produit le bloc texte injectable ;
 *   - tout code backend (orchestrateur, image-gen) qui doit valider / choisir
 *     un couple (poster_type, ratio, résolution).
 *
 * Les clés sont volontairement en snake_case stables — le label humain reste
 * libre côté UI. Pour ajouter un nouveau type, étends ici puis re-seed les
 * AgentDefinition concernés.
 */

export type PosterFormatEntry = {
  readonly label: string;
  readonly ratios: readonly string[];
  readonly resolutions: readonly ('1K' | '2K' | '4K')[];
  readonly recommended_resolution?: '1K' | '2K' | '4K';
};

export const POSTER_TYPE_FORMAT_RES_MAP = {
  flyer_vertical: {
    label: 'Affiche / Flyer vertical',
    ratios: ['3:4', '2:3'],
    resolutions: ['1K', '2K', '4K'],
  },
  post_social: {
    label: 'Post social',
    ratios: ['1:1', '4:5'],
    resolutions: ['1K', '2K'],
  },
  story: {
    label: 'Story',
    ratios: ['9:16'],
    resolutions: ['1K', '2K'],
  },
  banner: {
    label: 'Bannière',
    ratios: ['16:9', '21:9'],
    resolutions: ['2K', '4K'],
  },
  youtube_thumbnail: {
    label: 'Miniature YouTube',
    ratios: ['16:9'],
    resolutions: ['2K'],
    recommended_resolution: '2K',
  },
  business_card: {
    label: 'Carte de visite',
    ratios: ['3:2', '16:9'],
    resolutions: ['2K', '4K'],
  },
  menu_catalog: {
    label: 'Menu / catalogue',
    ratios: ['3:4', '4:5'],
    resolutions: ['2K', '4K'],
  },
  logo_concept: {
    label: 'Concept de logo',
    ratios: ['1:1'],
    resolutions: ['1K', '2K', '4K'],
  },
} as const satisfies Record<string, PosterFormatEntry>;

export type PosterTypeKey = keyof typeof POSTER_TYPE_FORMAT_RES_MAP;

/**
 * Retourne le bloc de référence formaté à injecter dans un system prompt.
 * Le format est volontairement compact et lisible par un LLM.
 */
export function formatPosterTypeReferenceBlock(): string {
  const entries = Object.values(POSTER_TYPE_FORMAT_RES_MAP) as readonly PosterFormatEntry[];
  const lines = entries.map((entry) => {
    const ratios = entry.ratios.join(' ou ');
    const resolutions = entry.resolutions.join(', ');
    const reco = entry.recommended_resolution ? ` (${entry.recommended_resolution} recommandée)` : '';
    return `- ${entry.label.padEnd(28)} : ${ratios.padEnd(14)} — résolutions ${resolutions}${reco}`;
  });

  return [
    '═══════════════════════════════════════════════════════════════',
    'RÉFÉRENCE FORMAT × RÉSOLUTION par type de visuel',
    '═══════════════════════════════════════════════════════════════',
    ...lines,
    '',
    "Règle : aligne toujours le ratio choisi sur le type de visuel ci-dessus.",
    "Pour les usages imprimables (flyer / menu / carte de visite), privilégie 2K",
    "ou 4K. Pour les usages web et social, 1K à 2K suffit.",
    '═══════════════════════════════════════════════════════════════',
  ].join('\n');
}

/**
 * Valide qu'un couple (poster_type, ratio) est dans la table de référence.
 * Renvoie undefined si tout est OK, sinon un message explicatif.
 */
export function validatePosterFormat(
  posterType: string | null | undefined,
  ratio: string | null | undefined,
): string | undefined {
  if (!posterType) return undefined;
  const entry = (POSTER_TYPE_FORMAT_RES_MAP as Record<string, PosterFormatEntry>)[posterType];
  if (!entry) return undefined; // type inconnu : on laisse passer (extensibilité)
  if (!ratio) return undefined;
  if (entry.ratios.includes(ratio)) return undefined;
  return `Ratio ${ratio} non recommandé pour ${entry.label}. Ratios valides : ${entry.ratios.join(', ')}.`;
}
