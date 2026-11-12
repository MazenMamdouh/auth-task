import { z } from 'zod';

/** The password rules, one per line of the live checklist. Mirrored on the API (sign-up.dto.ts). */
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { id: 'letter', label: 'At least one letter', test: (v: string) => /[A-Za-z]/.test(v) },
  { id: 'number', label: 'At least one number', test: (v: string) => /\d/.test(v) },
  { id: 'special', label: 'At least one special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Enter a valid email address');

export const signUpSchema = z.object({
  email,
  name: z.string().trim().min(3, 'Name must be at least 3 characters').max(50, 'Name must be at most 50 characters'),
  password: z
    .string()
    .max(128, 'Password must be at most 128 characters')
    .superRefine((value, ctx) => {
      for (const rule of PASSWORD_RULES) {
        if (!rule.test(value)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Password needs: ${rule.label.toLowerCase()}` });
      }
    }),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export type SignUpValues = z.infer<typeof signUpSchema>;
export type SignInValues = z.infer<typeof signInSchema>;
