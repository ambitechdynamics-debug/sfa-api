import { ArtisticResourceType } from '@prisma/client';
import { z } from 'zod';

const jsonValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.unknown()),
  z.record(z.unknown())
]);

export const artisticResourceIdParamsSchema = z.object({
  resourceId: z.string().min(1, 'resourceId is required')
});

export const createArtisticResourceSchema = z
  .object({
    title: z.string().trim().min(1, 'title is required'),
    category: z.string().trim().min(1, 'category is required'),
    resourceType: z.nativeEnum(ArtisticResourceType),
    url: z.string().trim().url('url must be valid').optional(),
    description: z.string().trim().min(1).optional(),
    tags: jsonValueSchema.optional(),
    content: jsonValueSchema.optional()
  })
  .strict();

export const updateArtisticResourceSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    resourceType: z.nativeEnum(ArtisticResourceType).optional(),
    url: z.string().trim().url('url must be valid').nullable().optional(),
    description: z.string().trim().min(1).nullable().optional(),
    tags: jsonValueSchema.nullable().optional(),
    content: jsonValueSchema.nullable().optional()
  })
  .strict();

export const listArtisticResourcesQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  resourceType: z.nativeEnum(ArtisticResourceType).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(10000).optional()
});

export const searchArtisticResourcesQuerySchema = listArtisticResourcesQuerySchema.extend({
  q: z.string().trim().min(1).optional()
});

export type CreateArtisticResourceInput = z.infer<typeof createArtisticResourceSchema>;
export type UpdateArtisticResourceInput = z.infer<typeof updateArtisticResourceSchema>;
export type ListArtisticResourcesQuery = z.infer<typeof listArtisticResourcesQuerySchema>;
export type SearchArtisticResourcesQuery = z.infer<typeof searchArtisticResourcesQuerySchema>;

export const analyzeImageSchema = z.object({
  url: z.string().trim().url('url must be valid').optional(),
  provider: z.string().trim().min(1).optional(),
  providerId: z.string().trim().min(1).optional(),
  model: z.string().trim().min(1).optional(),
  resourceImage: z.string().trim().url('resourceImage must be valid').optional(),
  context: z.object({
    module: z.string().optional(),
    action: z.string().optional()
  }).optional()
});

export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema>;

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional()
);

export const bulkUploadAnalyzeCreateSchema = z
  .object({
    provider: optionalNonEmptyString,
    providerId: optionalNonEmptyString,
    model: optionalNonEmptyString
  })
  .strict();

export type BulkUploadAnalyzeCreateInput = z.infer<typeof bulkUploadAnalyzeCreateSchema>;
