import { FileUsageType } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { getStorageProvider } from '../storage/storage.provider';
import { CreateFileInput } from './files.validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ensureProjectOwner = async (userId: string, projectId: string) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) {
    throw new AppError('Project not found', 404);
  }
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const filesService = {
  /**
   * Legacy JSON endpoint — stores a file URL provided by the client directly.
   * Kept for backward compatibility.
   */
  create: async (userId: string, projectId: string, input: CreateFileInput) => {
    await ensureProjectOwner(userId, projectId);

    return prisma.fileAsset.create({
      data: { ...input, userId, projectId },
    });
  },

  /**
   * Upload a file buffer to Cloudinary and persist the metadata in the DB.
   * If usageType === LOGO, also updates the project's M-ID brand memory.
   */
  upload: async (
    userId: string,
    projectId: string,
    file: Express.Multer.File,
    usageType: FileUsageType,
  ) => {
    await ensureProjectOwner(userId, projectId);

    const storage = getStorageProvider();

    const result = await storage.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      usageType,
    });

    const fileAsset = await prisma.fileAsset.create({
      data: {
        userId,
        projectId,
        fileUrl:      result.fileUrl,
        publicId:     result.publicId,
        fileType:     file.mimetype,
        originalName: file.originalname,
        usageType,
        fileSizeBytes: result.size ?? file.size,
        width:   result.width,
        height:  result.height,
        format:  result.format,
      },
    });

    // Non-blocking logo memory update
    if (usageType === FileUsageType.LOGO) {
      filesService._updateLogoMemory(userId, projectId, result.fileUrl).catch(
        (err) => console.error('[filesService._updateLogoMemory] silenced error:', err),
      );
    }

    return fileAsset;
  },

  listByProject: async (userId: string, projectId: string) => {
    await ensureProjectOwner(userId, projectId);

    return prisma.fileAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Delete a file from both Cloudinary and the database.
   */
  delete: async (userId: string, fileId: string) => {
    const file = await prisma.fileAsset.findFirst({
      where: { id: fileId, userId },
      select: { id: true, publicId: true },
    });

    if (!file) {
      throw new AppError('File asset not found', 404);
    }

    // Delete from Cloudinary if the file was uploaded through Cloudinary
    if (file.publicId) {
      const storage = getStorageProvider();
      await storage.deleteFile(file.publicId);
    }

    await prisma.fileAsset.delete({ where: { id: fileId } });

    return { id: fileId };
  },

  /**
   * Upload a generated poster image to Cloudinary and persist it as a GeneratedPoster record.
   */
  saveGeneratedPosterImage: async ({
    userId,
    projectId,
    imageBuffer,
    originalName,
    promptUsed,
    variationNumber = 1,
  }: {
    userId: string;
    projectId: string;
    imageBuffer: Buffer;
    originalName: string;
    promptUsed: string;
    variationNumber?: number;
  }) => {
    const storage = getStorageProvider();

    const result = await storage.uploadFile({
      buffer: imageBuffer,
      originalName,
      mimetype: 'image/png',
      usageType: FileUsageType.GENERATED_POSTER,
    });

    return prisma.generatedPoster.create({
      data: {
        userId,
        projectId,
        imageUrl:       result.fileUrl,
        promptUsed,
        variationNumber,
        status:         'GENERATED',
      },
    });
  },

  /**
   * Non-blocking: inject the uploaded logo URL into the project's M-ID memory entry.
   * Errors are silenced — an upload succeeds even if this fails.
   */
  _updateLogoMemory: async (
    userId: string,
    projectId: string,
    logoUrl: string,
  ) => {
    const memoryDef = await prisma.memoryDefinition.findUnique({
      where: { key: 'M-ID' },
      select: { id: true },
    });

    if (!memoryDef) return; // Memory definition not seeded yet

    await prisma.memoryEntry.upsert({
      where: {
        projectId_memoryDefinitionId: {
          projectId,
          memoryDefinitionId: memoryDef.id,
        },
      },
      create: {
        memoryDefinitionId: memoryDef.id,
        userId,
        projectId,
        content: {
          brand_identity: {
            logo_url: logoUrl,
            source:   'uploaded_logo',
            status:   'waiting_analysis',
          },
        },
      },
      update: {
        content: {
          brand_identity: {
            logo_url: logoUrl,
            source:   'uploaded_logo',
            status:   'waiting_analysis',
          },
        },
      },
    });
  },
};
