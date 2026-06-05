import { Router } from 'express';
import { requireAdmin } from '../../middlewares/auth.middleware';
import { adminJwtMiddleware } from '../../middlewares/adminJwt.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { settingsController } from './settings.controller';
import { settingKeyParamSchema, upsertSettingsSchema, deleteSettingsSchema } from './settings.validation';

const router = Router();

// Mounted under /api/admin/settings — gated by the admin JWT (email+password).
router.use(adminJwtMiddleware, requireAdmin);

router.get('/',                          asyncHandler(settingsController.getAll));
// IMPORTANT : /effective doit être déclaré AVANT /:key pour ne pas être intercepté
router.get('/effective',                 asyncHandler(settingsController.listEffective));
router.get('/category/:category',        asyncHandler(settingsController.getByCategory));
router.get('/:key', validate({ params: settingKeyParamSchema }), asyncHandler(settingsController.getOne));
router.put('/', validate({ body: upsertSettingsSchema }),        asyncHandler(settingsController.upsertMany));
router.post('/seed',                     asyncHandler(settingsController.seed));
router.post('/delete', validate({ body: deleteSettingsSchema }), asyncHandler(settingsController.deleteMany));

export default router;
