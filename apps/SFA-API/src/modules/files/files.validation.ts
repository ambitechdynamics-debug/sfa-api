import { FileUsageType } from '@prisma/client';
import { z } from 'zod';

export const projectFileParamsSchema = z.object({
  projectId: z.string().min(1, 'projectId is required')
});

export const fileIdParamsSchema = z.object({
  fileId: z.string().min(1, 'fileId is required')
});

export const updateFileSchema = z
  .object({
    usageType: z.nativeEnum(FileUsageType)
  })
  .strict();

export const createFileSchema = z
  .object({
    fileUrl: z.string().trim().url('fileUrl must be a valid URL'),
    fileType: z.string().trim().min(1, 'fileType is required'),
    originalName: z.string().trim().min(1, 'originalName is required'),
    usageType: z.nativeEnum(FileUsageType).default(FileUsageType.OTHER)
  })
  .strict();

export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;

/** Body schema for the multipart upload endpoint */
export const uploadFileBodySchema = z.object({
  usageType: z.nativeEnum(FileUsageType).default(FileUsageType.OTHER),
});

export type UploadFileBody = z.infer<typeof uploadFileBodySchema>;
