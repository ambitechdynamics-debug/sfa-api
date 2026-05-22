import { Request, Response } from "express";
import { z } from "zod";
import * as creationOptionsService from "./creation-options.service";
import {
  createCreationOptionSchema,
  updateCreationOptionSchema,
} from "./creation-options.validation";

export async function getAllCreationOptions(req: Request, res: Response) {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const options = await creationOptionsService.getAllCreationOptions(includeInactive);
    res.json(options);
  } catch (error) {
    console.error("[CreationOptionsController] error getting options:", error);
    res.status(500).json({ error: "Failed to fetch creation options" });
  }
}

export async function getCreationOptionById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const option = await creationOptionsService.getCreationOptionById(id);
    if (!option) {
      return res.status(404).json({ error: "Creation option not found" });
    }
    res.json(option);
  } catch (error) {
    console.error("[CreationOptionsController] error getting option by id:", error);
    res.status(500).json({ error: "Failed to fetch creation option" });
  }
}

export async function createCreationOption(req: Request, res: Response) {
  try {
    const data = createCreationOptionSchema.parse(req.body);
    const newOption = await creationOptionsService.createCreationOption(data);
    res.status(201).json(newOption);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("[CreationOptionsController] error creating option:", error);
    res.status(500).json({ error: "Failed to create creation option" });
  }
}

export async function updateCreationOption(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = updateCreationOptionSchema.parse(req.body);
    const updatedOption = await creationOptionsService.updateCreationOption(id, data);
    res.json(updatedOption);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: error.errors });
    }
    console.error("[CreationOptionsController] error updating option:", error);
    res.status(500).json({ error: "Failed to update creation option" });
  }
}

export async function deleteCreationOption(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await creationOptionsService.deleteCreationOption(id);
    res.status(204).send();
  } catch (error) {
    console.error("[CreationOptionsController] error deleting option:", error);
    res.status(500).json({ error: "Failed to delete creation option" });
  }
}
