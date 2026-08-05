import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Email is invalid")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "Password must contain at least 8 characters"),
});
