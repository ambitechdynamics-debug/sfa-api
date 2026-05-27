import multer, { FileFilterCallback } from 'multer';
import { NextFunction, Request, Response } from 'express';
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

function handleMulterError(err: unknown, next: NextFunction) {
  if (!err) return next();

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Fichier trop volumineux (max 10 Mo).', 400));
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new AppError('Nombre de fichiers trop élevé ou champ fichier invalide.', 400));
    }
    return next(new AppError(`Erreur upload : ${err.message}`, 400));
  }

  // Custom AppError thrown by fileFilter
  if (err instanceof AppError) return next(err);

  next(err);
}

/**
 * Express middleware for single-file upload.
 * File is available as `req.file` (Buffer in memory, never written to disk).
 */
export function uploadSingle(fieldName = 'file') {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    multerInstance.single(fieldName)(req, res, (err) => {
      handleMulterError(err, next);
    });
  };
}

/**
 * Express middleware for multi-file upload.
 * Files are available as `req.files` (Buffers in memory, never written to disk).
 */
export function uploadMultiple(fieldName = 'files', maxCount = 20) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    multerInstance.array(fieldName, maxCount)(req, res, (err) => {
      handleMulterError(err, next);
    });
  };
}
