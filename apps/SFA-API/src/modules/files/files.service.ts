import { FileUsageType } from '@prisma/client';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/appError';
import { getStorageProvider } from '../storage/storage.provider';
import { CreateFileInput, UpdateFileInput } from './files.validation';

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

    // Note: la pré-écriture de M_ID/brand_identity à l'upload du logo a été
    // retirée — désormais c'est le BrandAgent (orchestrateur, travail-scoped)
    // qui analyse le logo et écrit M_ID au bon endroit.

    return fileAsset;
  },

  listByProject: async (userId: string, projectId: string) => {
    await ensureProjectOwner(userId, projectId);

    return prisma.fileAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  },

  update: async (userId: string, fileId: string, input: UpdateFileInput) => {
    const file = await prisma.fileAsset.findFirst({
      where: { id: fileId, userId },
      select: { id: true },
    });

    if (!file) {
      throw new AppError('File asset not found', 404);
    }

    return prisma.fileAsset.update({
      where: { id: fileId },
      data: { usageType: input.usageType },
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

};
