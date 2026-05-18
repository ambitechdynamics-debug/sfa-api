import { z } from 'zod';

export const upsertSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key:      z.string().min(1),
      value:    z.string(),
      category: z.string().optional(),
      isSecret: z.boolean().optional(),
    })
  ).min(1, 'At least one setting is required'),
});

export type UpsertSettingsInput = z.infer<typeof upsertSettingsSchema>;

export const settingKeyParamSchema = z.object({
  key: z.string().min(1),
});

export const deleteSettingsSchema = z.object({
  keys: z.array(z.string().min(1)).min(1, 'At least one key is required'),
});
