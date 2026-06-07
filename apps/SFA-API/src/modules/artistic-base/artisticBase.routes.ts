import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middlewares/auth.middleware';
import { adminJwtMiddleware } from '../../middlewares/adminJwt.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { uploadMultiple, uploadSingle } from '../../middlewares/upload.middleware';
import { artisticBaseController } from './artisticBase.controller';
import {
  artisticResourceIdParamsSchema,
  bulkUploadAnalyzeCreateSchema,
  createArtisticResourceSchema,
  listArtisticResourcesQuerySchema,
  searchArtisticResourcesQuerySchema,
  updateArtisticResourceSchema,
  analyzeImageSchema
} from './artisticBase.validation';

const router = Router();

const adminJwtGuards = [adminJwtMiddleware, requireAdmin] as const;

// ─── UPLOAD IMAGE (must be before /:resourceId routes) ────────────────────────
router.post(
  '/admin/artistic-resources/upload-image',
  authMiddleware,
  requireAdmin,
  uploadSingle('file'),
  asyncHandler(artisticBaseController.uploadImage)
);

router.post(
  '/admin/artistic-resources/bulk-upload-analyze-create',
  authMiddleware,
  requireAdmin,
  uploadMultiple('files', 20),
  validate({ body: bulkUploadAnalyzeCreateSchema }),
  asyncHandler(artisticBaseController.bulkUploadAnalyzeCreate)
);

router.post(
  '/admin/artistic-resources/analyze-image',
  authMiddleware,
  requireAdmin,
  validate({ body: analyzeImageSchema }),
  asyncHandler(artisticBaseController.analyzeImage)
);

router.post(
  '/admin-v2/artistic-resources/upload-image',
  ...adminJwtGuards,
  uploadSingle('file'),
  asyncHandler(artisticBaseController.uploadImage)
);

router.post(
  '/admin-v2/artistic-resources/bulk-upload-analyze-create',
  ...adminJwtGuards,
  uploadMultiple('files', 20),
  validate({ body: bulkUploadAnalyzeCreateSchema }),
  asyncHandler(artisticBaseController.bulkUploadAnalyzeCreate)
);

router.post(
  '/admin-v2/artistic-resources/analyze-image',
  ...adminJwtGuards,
  validate({ body: analyzeImageSchema }),
  asyncHandler(artisticBaseController.analyzeImage)
);

router.post(
  '/admin-v2/artistic-resources',
  ...adminJwtGuards,
  validate({ body: createArtisticResourceSchema }),
  asyncHandler(artisticBaseController.create)
);

router.get(
  '/admin-v2/artistic-resources',
  ...adminJwtGuards,
  validate({ query: listArtisticResourcesQuerySchema }),
  asyncHandler(artisticBaseController.list)
);

router.patch(
  '/admin-v2/artistic-resources/:resourceId',
  ...adminJwtGuards,
  validate({ params: artisticResourceIdParamsSchema, body: updateArtisticResourceSchema }),
  asyncHandler(artisticBaseController.update)
);

router.delete(
  '/admin-v2/artistic-resources/:resourceId',
  ...adminJwtGuards,
  validate({ params: artisticResourceIdParamsSchema }),
  asyncHandler(artisticBaseController.delete)
);

router.post(
  '/admin/artistic-resources',
  authMiddleware,
  requireAdmin,
  validate({ body: createArtisticResourceSchema }),
  asyncHandler(artisticBaseController.create)
);
router.get(
  '/artistic-resources',
  validate({ query: listArtisticResourcesQuerySchema }),
  asyncHandler(artisticBaseController.list)
);
router.get(
  '/artistic-resources/search',
  validate({ query: searchArtisticResourcesQuerySchema }),
  asyncHandler(artisticBaseController.search)
);
router.get(
  '/artistic-resources/:resourceId',
  validate({ params: artisticResourceIdParamsSchema }),
  asyncHandler(artisticBaseController.getById)
);
router.patch(
  '/admin/artistic-resources/:resourceId',
  authMiddleware,
  requireAdmin,
  validate({ params: artisticResourceIdParamsSchema, body: updateArtisticResourceSchema }),
  asyncHandler(artisticBaseController.update)
);
router.delete(
  '/admin/artistic-resources/:resourceId',
  authMiddleware,
  requireAdmin,
  validate({ params: artisticResourceIdParamsSchema }),
  asyncHandler(artisticBaseController.delete)
);

export default router;
