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
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const searchArtisticResourcesQuerySchema = listArtisticResourcesQuerySchema.extend({
  q: z.string().trim().min(1).optional()
});

export type CreateArtisticResourceInput = z.infer<typeof createArtisticResourceSchema>;
export type UpdateArtisticResourceInput = z.infer<typeof updateArtisticResourceSchema>;
export type ListArtisticResourcesQuery = z.infer<typeof listArtisticResourcesQuerySchema>;
export type SearchArtisticResourcesQuery = z.infer<typeof searchArtisticResourcesQuerySchema>;

export const analyzeImageSchema = z.object({
  url: z.string().trim().url('url must be valid'),
  provider: z.string().trim().min(1).optional()
}).strict();

export type AnalyzeImageInput = z.infer<typeof analyzeImageSchema>;
