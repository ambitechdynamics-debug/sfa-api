import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { projectsController } from './projects.controller';
import { createProjectSchema, projectIdParamsSchema, updateProjectSchema } from './projects.validation';

const router = Router();

router.use(authMiddleware);

router.post('/', validate({ body: createProjectSchema }), asyncHandler(projectsController.create));
router.get('/', asyncHandler(projectsController.list));
router.get('/:projectId', validate({ params: projectIdParamsSchema }), asyncHandler(projectsController.getById));
router.patch(
  '/:projectId',
  validate({ params: projectIdParamsSchema, body: updateProjectSchema }),
  asyncHandler(projectsController.update)
);
router.delete('/:projectId', validate({ params: projectIdParamsSchema }), asyncHandler(projectsController.delete));

export default router;
