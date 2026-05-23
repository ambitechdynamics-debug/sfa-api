import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { showcaseController } from './showcase.controller';

const router = Router();

// Route publique (pas d'authMiddleware). La galerie marketing affiche
// uniquement des posters validés (isExample=true ou qualityScore >= 80).
router.get('/visuals', asyncHandler(showcaseController.listVisuals));

export default router;
