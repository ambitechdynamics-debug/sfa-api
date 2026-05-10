import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'fullName is required'),
  email: z.string().trim().email('email must be valid').toLowerCase(),
  password: z.string().min(8, 'password must contain at least 8 characters'),
  phone: z.string().trim().min(1).optional()
});

export const loginSchema = z.object({
  email: z.string().trim().email('email must be valid').toLowerCase(),
  password: z.string().min(1, 'password is required')
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
