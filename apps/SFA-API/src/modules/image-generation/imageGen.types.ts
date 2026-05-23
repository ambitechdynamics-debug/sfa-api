/**
 * Types partagés pour la génération d'image (Nano Banana / Gemini Image / mock).
 */

export type ImageGenProvider = 'gemini' | 'openai-image' | 'mock';

export interface ImageGenInput {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '3:4' | '4:3';
  variationNumber: number; // 1..N, used as seed for deterministic mocks and as a label
  /**
   * Hint about the desired style. Useful for the mock to vary its picsum seed.
   */
  styleSeed?: string;
  /** URL de l'image modèle pour forcer le gabarit/composition (Niveau 2: Clonage visuel) */
  layoutReferenceUrl?: string;
  /** URL de l'image de style pour forcer la couleur/texture (Niveau 2: Clonage visuel) */
  styleReferenceUrl?: string;
  /**
   * Assets fournis par l'utilisateur (logo, produit, inspiration…) à inclure
   * comme images de référence dans l'appel au générateur. Permet à Gemini
   * d'utiliser le vrai logo/produit dans le rendu plutôt que d'en inventer un.
   * Limité par le provider (Gemini accepte plusieurs inlineData).
   */
  userAssets?: Array<{
    /** Type métier — sert à intituler l'instruction dans le prompt. */
    type: 'logo' | 'product' | 'reference' | 'poster' | 'character' | 'other';
    /** URL Cloudinary publique. */
    url: string;
  }>;
}

export interface ImageGenResult {
  /** Buffer containing the generated image (PNG by default). */
  buffer: Buffer;
  /** MIME type of the buffer. */
  mimeType: string;
  /** Original suggested filename. */
  fileName: string;
  /** Optional metadata returned by the provider. */
  metadata?: Record<string, unknown>;
}

export interface ImageGenAdapter {
  generate(input: ImageGenInput): Promise<ImageGenResult>;
}
