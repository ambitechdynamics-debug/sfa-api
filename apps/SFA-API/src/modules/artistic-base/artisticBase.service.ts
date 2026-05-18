import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { getStorageProvider } from '../storage/storage.provider';
import {
  CreateArtisticResourceInput,
  ListArtisticResourcesQuery,
  SearchArtisticResourcesQuery,
  UpdateArtisticResourceInput,
  AnalyzeImageInput
} from './artisticBase.validation';
import { callVisionAI } from '../ai/ai.service';
import { AIProvider } from '../ai/ai.types';

const buildPagination = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit
});

const toJsonInput = (value: unknown) => value as Prisma.InputJsonValue;
const toNullableJsonInput = (value: unknown) =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

export const artisticBaseService = {
  create: async (input: CreateArtisticResourceInput) => {
    return prisma.artisticResource.create({
      data: {
        title: input.title,
        category: input.category,
        resourceType: input.resourceType,
        url: input.url,
        description: input.description,
        tags: input.tags === undefined ? [] : toJsonInput(input.tags),
        content: input.content === undefined ? {} : toJsonInput(input.content)
      }
    });
  },

  list: async (query: ListArtisticResourcesQuery) => {
    const where: Prisma.ArtisticResourceWhereInput = {
      category: query.category,
      resourceType: query.resourceType
    };

    const [items, total] = await prisma.$transaction([
      prisma.artisticResource.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...buildPagination(query.page, query.limit)
      }),
      prisma.artisticResource.count({ where })
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  },

  search: async (query: SearchArtisticResourcesQuery) => {
    const searchWhere: Prisma.ArtisticResourceWhereInput = query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { category: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } }
          ]
        }
      : {};

    const where: Prisma.ArtisticResourceWhereInput = {
      ...searchWhere,
      category: query.category,
      resourceType: query.resourceType
    };

    const [items, total] = await prisma.$transaction([
      prisma.artisticResource.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...buildPagination(query.page, query.limit)
      }),
      prisma.artisticResource.count({ where })
    ]);

    return {
      items,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    };
  },

  getById: async (resourceId: string) => {
    const resource = await prisma.artisticResource.findUnique({
      where: { id: resourceId }
    });

    if (!resource) {
      throw new AppError('Artistic resource not found', 404);
    }

    return resource;
  },

  update: async (resourceId: string, input: UpdateArtisticResourceInput) => {
    await artisticBaseService.getById(resourceId);

    return prisma.artisticResource.update({
      where: { id: resourceId },
      data: {
        title: input.title,
        category: input.category,
        resourceType: input.resourceType,
        url: input.url,
        description: input.description,
        tags: input.tags === undefined ? undefined : toNullableJsonInput(input.tags),
        content: input.content === undefined ? undefined : toNullableJsonInput(input.content)
      }
    });
  },

  delete: async (resourceId: string) => {
    await artisticBaseService.getById(resourceId);

    await prisma.artisticResource.delete({
      where: { id: resourceId }
    });

    return { id: resourceId };
  },

  /**
   * Upload an image to Cloudinary under the artistic-resources folder.
   * Returns the public URL and Cloudinary publicId.
   */
  uploadImage: async (file: Express.Multer.File) => {
    const storage = getStorageProvider();
    const result = await storage.uploadFile({
      buffer:       file.buffer,
      originalName: file.originalname,
      mimetype:     file.mimetype,
      usageType:    'ARTISTIC_RESOURCE',
    });
    return { url: result.fileUrl, publicId: result.publicId };
  },

  analyzeImage: async (input: AnalyzeImageInput) => {
    const imageUrl = input.resourceImage || input.url;
    if (!imageUrl) {
      throw new AppError("L'URL de l'image est obligatoire.", 400);
    }
    const providerId = input.providerId || input.provider || 'gemini';
    const model = input.model || undefined;

    const systemPrompt = `Tu es un expert en direction artistique et analyse visuelle pour le design graphique.
Analyse l'image fournie et extrais les informations pour remplir la base de ressources artistiques.
Tu dois répondre UNIQUEMENT avec un objet JSON valide suivant ce format strict :
{
  "title": "Un titre court et descriptif",
  "category": "Une catégorie appropriée (ex: Événement, Promotion, Corporate, etc. - invente si nécessaire)",
  "resourceType": "STYLE", // Doit être parmi: MODEL, TEXTURE, FONT, PALETTE, STYLE, REFERENCE
  "description": "Une description textuelle de l'image (composition, ambiance, usage)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": {
    "colors": {
      "color_mood": "...",
      "contrast_notes": "...",
      "dominant_colors": ["..."],
      "recommended_color_codes": ["#..."]
    },
    "style_key": "...",
    "style_name": "...",
    "typography": {
      "title_style": "...",
      "badge_text_style": "...",
      "typography_rules": ["..."],
      "recommended_fonts": ["..."],
      "secondary_text_style": "..."
    },
    "composition": {
      "main_subject": "...",
      "title_position": "...",
      "background_style": "...",
      "layout_structure": "...",
      "visual_hierarchy": ["..."],
      "secondary_subjects": "...",
      "year_badge_position": "...",
      "description_position": "..."
    },
    "quality_rules": ["..."],
    "graphic_elements": {
      "elements_to_avoid": ["..."],
      "optional_elements": ["..."],
      "recommended_elements": ["..."]
    },
    "visual_description": {
      "mood": "...",
      "main_style": "...",
      "target_usage": ["..."],
      "visual_level": "premium"
    },
    "negative_prompt_rules": ["..."],
    "prompt_usage_instruction": "..."
  }
}

Assure-toi de respecter scrupuleusement cette structure JSON, en particulier pour le champ 'content'. Si un élément n'est pas applicable, mets une chaîne vide ou omet le, mais garde la structure globale.`;

    const aiResponse = await callVisionAI({
      provider: providerId as any,
      model,
      systemPrompt,
      userPrompt: 'Analyse cette image et extrais les métadonnées requises au format JSON.',
      imageUrls: [imageUrl],
      responseFormat: 'json',
      temperature: 0.2
    });

    if (aiResponse.parsed && !(aiResponse.parsed as any)._parseError) {
      return aiResponse.parsed;
    } else {
      throw new AppError("L'IA n'a pas pu analyser l'image correctement.", 500);
    }
  },
};
