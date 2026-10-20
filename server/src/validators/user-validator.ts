import { z } from "zod";

export const passwordSchema = z.string().min(12).max(72)
  .refine(value => Buffer.byteLength(value, "utf8") <= 72, "Mật khẩu tối đa 72 byte.");
export const createUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: passwordSchema,
  role: z.enum(["EMPLOYEE", "ADMIN"]).default("EMPLOYEE"),
}).strict();
export const userQuerySchema = z.object({
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().positive().default(1),
});
