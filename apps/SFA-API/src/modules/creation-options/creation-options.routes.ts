import { Router } from "express";
import * as creationOptionsController from "./creation-options.controller";
import { authMiddleware as authenticate, requireAdmin } from "../../middlewares/auth.middleware";

const router = Router();

// Public / User routes
router.get("/", authenticate, creationOptionsController.getAllCreationOptions);
router.get("/:id", authenticate, creationOptionsController.getCreationOptionById);

// Admin routes
router.post("/", authenticate, requireAdmin, creationOptionsController.createCreationOption);
router.put("/:id", authenticate, requireAdmin, creationOptionsController.updateCreationOption);
router.delete("/:id", authenticate, requireAdmin, creationOptionsController.deleteCreationOption);

export default router;
