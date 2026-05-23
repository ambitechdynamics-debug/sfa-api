import { GeneratedPosterStatus } from '@prisma/client';
import { prisma } from '../../config/database';

const DEFAULT_LIMIT = 12;
const MIN_QUALITY_FOR_AUTO_FEATURE = 80;

export interface ShowcaseVisual {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  createdAt: string;
  isFeatured: boolean;
  qualityScore: number;
}

export const showcaseService = {
  /**
   * Renvoie jusqu'à `limit` affiches publiques pour la galerie marketing.
   * Critères : statut GENERATED + (isExample=true OU qualityScore >= 80).
   * Tri : isExample d'abord, puis qualityScore desc, puis createdAt desc.
   */
  list: async (limit = DEFAULT_LIMIT): Promise<ShowcaseVisual[]> => {
    const safeLimit = Math.min(Math.max(1, limit), 48);

    const posters = await prisma.generatedPoster.findMany({
      where: {
        status: GeneratedPosterStatus.GENERATED,
        OR: [
          { isExample: true },
          { qualityScore: { gte: MIN_QUALITY_FOR_AUTO_FEATURE } },
        ],
      },
      orderBy: [
        { isExample: 'desc' },
        { qualityScore: 'desc' },
        { createdAt: 'desc' },
      ],
      take: safeLimit,
      select: {
        id: true,
        imageUrl: true,
        promptUsed: true,
        qualityScore: true,
        isExample: true,
        createdAt: true,
        travail: {
          select: {
            title: true,
            category: true,
            project: { select: { title: true } }
          }
        },
      },
    });

    return posters.map((poster) => ({
      id: poster.id,
      // Préférer le titre de la marque (project), fallback sur le titre du travail
      title: poster.travail?.project?.title || poster.travail?.title || poster.promptUsed || 'Affiche Studio Flyer AI',
      imageUrl: poster.imageUrl,
      category: poster.travail?.category || 'Création',
      createdAt: poster.createdAt.toISOString(),
      isFeatured: poster.isExample,
      qualityScore: poster.qualityScore ?? 0,
    }));
  },
};
