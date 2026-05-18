import { Router } from 'express';
import { authMiddleware, requireAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { settingsController } from './settings.controller';
import { settingKeyParamSchema, upsertSettingsSchema, deleteSettingsSchema } from './settings.validation';

const router = Router();

// All settings routes require authentication + ADMIN role
router.use(authMiddleware, requireAdmin);

router.get('/',                          asyncHandler(settingsController.getAll));
router.get('/category/:category',        asyncHandler(settingsController.getByCategory));
router.get('/:key', validate({ params: settingKeyParamSchema }), asyncHandler(settingsController.getOne));
router.put('/', validate({ body: upsertSettingsSchema }),        asyncHandler(settingsController.upsertMany));
router.post('/seed',                     asyncHandler(settingsController.seed));
router.post('/delete', validate({ body: deleteSettingsSchema }), asyncHandler(settingsController.deleteMany));

export default router;
