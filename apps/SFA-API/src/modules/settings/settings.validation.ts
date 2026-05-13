import { z } from 'zod';

export const upsertSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key:   z.string().min(1),
      value: z.string(),
    })
  ).min(1, 'At least one setting is required'),
});

export type UpsertSettingsInput = z.infer<typeof upsertSettingsSchema>;

export const settingKeyParamSchema = z.object({
  key: z.string().min(1),
});
