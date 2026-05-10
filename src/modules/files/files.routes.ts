import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { uploadSingle } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { filesController } from './files.controller';
import { createFileSchema, fileIdParamsSchema, projectFileParamsSchema } from './files.validation';

const router = Router();

router.use(authMiddleware);

// ─── Cloudinary upload (multipart/form-data) ──────────────────────────────────
// Registered BEFORE the generic POST /projects/:projectId/files route to avoid
// Express matching "upload" as the projectId segment of that route.
router.post(
  '/projects/:projectId/files/upload',
  validate({ params: projectFileParamsSchema }),
  uploadSingle('file'),
  asyncHandler(filesController.upload),
);

// ─── Legacy JSON endpoint ────────────────────────────────────────────────────
router.post(
  '/projects/:projectId/files',
  validate({ params: projectFileParamsSchema, body: createFileSchema }),
  asyncHandler(filesController.create),
);

router.get(
  '/projects/:projectId/files',
  validate({ params: projectFileParamsSchema }),
  asyncHandler(filesController.listByProject),
);

router.delete(
  '/files/:fileId',
  validate({ params: fileIdParamsSchema }),
  asyncHandler(filesController.delete),
);

export default router;
