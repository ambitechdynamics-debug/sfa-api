import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppError } from '../utils/appError';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    // Pass the error as a generic Error so Multer's types accept it;
    // the middleware layer will unwrap it via the instanceof AppError check.
    const err = new AppError(
      `Format non autorisé : ${file.mimetype}. Formats acceptés : JPEG, PNG, WebP.`,
      400,
    );
    return cb(err as unknown as Error);
  }
  cb(null, true);
};

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

/**
 * Express middleware for single-file upload.
 * File is available as `req.file` (Buffer in memory, never written to disk).
 */
export function uploadSingle(fieldName = 'file') {
  return (
    req: Request,
    res: Parameters<ReturnType<typeof multerInstance.single>>[1],
    next: Parameters<ReturnType<typeof multerInstance.single>>[2],
  ) => {
    multerInstance.single(fieldName)(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Fichier trop volumineux (max 10 Mo).', 400));
        }
        return next(new AppError(`Erreur upload : ${err.message}`, 400));
      }

      // Custom AppError thrown by fileFilter
      if (err instanceof AppError) return next(err);

      next(err);
    });
  };
}
