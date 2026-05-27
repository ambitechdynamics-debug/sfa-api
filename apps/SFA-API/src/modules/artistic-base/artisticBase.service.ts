import { createHash } from 'node:crypto';
import { ArtisticResourceType, Prisma, type ArtisticResource } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { getStorageProvider } from '../storage/storage.provider';
import {
  BulkUploadAnalyzeCreateInput,
  CreateArtisticResourceInput,
  ListArtisticResourcesQuery,
  SearchArtisticResourcesQuery,
  UpdateArtisticResourceInput,
  AnalyzeImageInput
} from './artisticBase.validation';
import { callVisionAI } from '../ai/ai.service';

const buildPagination = (page?: number, limit?: number) => {
  if (page === undefined || limit === undefined) return {};
  return {
    skip: (page - 1) * limit,
    take: limit
  };
};

const toJsonInput = (value: unknown) => value as Prisma.InputJsonValue;
const toNullableJsonInput = (value: unknown) =>
  value === null ? Prisma.JsonNull : (value as Prisma.InputJsonValue);

type BulkFailureStage = 'upload' | 'analyze' | 'create' | 'duplicate';

type BulkUploadAnalyzeCreateParams = BulkUploadAnalyzeCreateInput & {
  files: Express.Multer.File[];
};

const VALID_RESOURCE_TYPES = new Set<string>(Object.values(ArtisticResourceType));

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringOrFallback(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function titleFromFileName(fileName: string) {
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  return baseName || 'Ressource artistique';
}

function normalizeResourceType(value: unknown): ArtisticResourceType {
  if (typeof value === 'string' && VALID_RESOURCE_TYPES.has(value)) {
    return value as ArtisticResourceType;
  }
  return ArtisticResourceType.STYLE;
}

function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((tag) => (typeof tag === 'string' ? tag.trim() : String(tag).trim()))
    .filter(Boolean);
}

function hashFileBuffer(buffer: Buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function buildCreateInputFromAnalysis(
  analysis: unknown,
  imageUrl: string,
  fileName: string,
  metadata?: { imageHash: string },
): CreateArtisticResourceInput {
  const data = isRecord(analysis) ? analysis : {};
  const content = isRecord(data.content) ? data.content : {};
  const existingImport = isRecord(content.import) ? content.import : {};

  return {
    title: stringOrFallback(data.title, titleFromFileName(fileName)),
    category: stringOrFallback(data.category, 'Promotion'),
    resourceType: normalizeResourceType(data.resourceType),
    url: imageUrl,
    description: stringOrFallback(
      data.description,
      `Ressource artistique importee depuis ${fileName}.`,
    ),
    tags: normalizeTags(data.tags),
    content: metadata
      ? {
          ...content,
          import: {
            ...existingImport,
            imageHash: metadata.imageHash,
            fileName,
            importedAt: new Date().toISOString(),
          },
        }
      : content,
  };
}

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
        page: query.page ?? 1,
        limit: query.limit ?? total,
        total,
        totalPages: query.limit ? Math.ceil(total / query.limit) : 1
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
        page: query.page ?? 1,
        limit: query.limit ?? total,
        total,
        totalPages: query.limit ? Math.ceil(total / query.limit) : 1
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

  bulkUploadAnalyzeCreate: async (input: BulkUploadAnalyzeCreateParams) => {
    if (!input.files.length) {
      throw new AppError('Aucun fichier fourni.', 400);
    }

    const created: ArtisticResource[] = [];
    const seenHashes = new Set<string>();
    const failed: Array<{
      index: number;
      fileName: string;
      stage: BulkFailureStage;
      message: string;
    }> = [];

    const processFile = async (file: Express.Multer.File, index: number) => {
      let stage: BulkFailureStage = 'upload';

      try {
        const imageHash = hashFileBuffer(file.buffer);
        if (seenHashes.has(imageHash)) {
          failed.push({
            index,
            fileName: file.originalname,
            stage: 'duplicate',
            message: 'Cette image est déjà présente dans le lot.',
          });
          return;
        }
        seenHashes.add(imageHash);

        const existingResource = await prisma.artisticResource.findFirst({
          where: {
            content: {
              path: ['import', 'imageHash'],
              equals: imageHash,
            },
          },
          select: { id: true, title: true },
        });

        if (existingResource) {
          failed.push({
            index,
            fileName: file.originalname,
            stage: 'duplicate',
            message: `Cette image existe déjà dans la base artistique (${existingResource.title}).`,
          });
          return;
        }

        const uploaded = await artisticBaseService.uploadImage(file);

        stage = 'analyze';
        const analysis = await artisticBaseService.analyzeImage({
          resourceImage: uploaded.url,
          providerId: input.providerId,
          provider: input.provider,
          model: input.model,
          context: {
            module: 'artistic-base',
            action: 'bulk-upload-analyze-create',
          },
        });

        stage = 'create';
        const resource = await artisticBaseService.create(
          buildCreateInputFromAnalysis(analysis, uploaded.url, file.originalname, { imageHash }),
        );
        created.push(resource);
      } catch (error) {
        failed.push({
          index,
          fileName: file.originalname,
          stage,
          message: getErrorMessage(error),
        });
      }
    };

    const concurrency = 2;
    for (let i = 0; i < input.files.length; i += concurrency) {
      const batch = input.files.slice(i, i + concurrency);
      await Promise.all(batch.map((file, offset) => processFile(file, i + offset)));
    }

    return { created, failed };
  },
};
