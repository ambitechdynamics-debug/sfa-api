import { Request, Response } from "express";
import { z } from "zod";
import * as creationOptionsService from "./creation-options.service";
import {
  createCreationOptionSchema,
  updateCreationOptionSchema,
} from "./creation-options.validation";
import { sendSuccess } from "../../utils/apiResponse";

export async function getAllCreationOptions(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const options = await creationOptionsService.getAllCreationOptions(includeInactive);
    return sendSuccess(res, "Creation options retrieved", options);
  } catch (error) {
    console.error("[CreationOptionsController] error getting options:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch creation options" });
  }
}

export async function getCreationOptionById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const option = await creationOptionsService.getCreationOptionById(id);
    if (!option) {
      return res.status(404).json({ success: false, message: "Creation option not found" });
    }
    return sendSuccess(res, "Creation option retrieved", option);
  } catch (error) {
    console.error("[CreationOptionsController] error getting option by id:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch creation option" });
  }
}

export async function createCreationOption(req: Request, res: Response) {
  try {
    const data = createCreationOptionSchema.parse(req.body);
    const newOption = await creationOptionsService.createCreationOption(data);
    return sendSuccess(res, "Creation option created", newOption, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Validation error", details: error.errors });
    }
    console.error("[CreationOptionsController] error creating option:", error);
    return res.status(500).json({ success: false, message: "Failed to create creation option" });
  }
}

export async function updateCreationOption(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateCreationOptionSchema.parse(req.body);
    const updatedOption = await creationOptionsService.updateCreationOption(id, data);
    return sendSuccess(res, "Creation option updated", updatedOption);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: "Validation error", details: error.errors });
    }
    console.error("[CreationOptionsController] error updating option:", error);
    return res.status(500).json({ success: false, message: "Failed to update creation option" });
  }
}

export async function deleteCreationOption(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await creationOptionsService.deleteCreationOption(id);
    return sendSuccess(res, "Creation option deleted", { id });
  } catch (error) {
    console.error("[CreationOptionsController] error deleting option:", error);
    return res.status(500).json({ success: false, message: "Failed to delete creation option" });
  }
}
