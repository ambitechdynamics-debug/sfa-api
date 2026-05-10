import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { getStorageProvider } from '../storage/storage.provider';
import {
  CreateArtisticResourceInput,
  ListArtisticResourcesQuery,
  SearchArtisticResourcesQuery,
  UpdateArtisticResourceInput
} from './artisticBase.validation';

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
};
