import { z } from "zod";

const articleStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const articleSlugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(280),
});

export const articleQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  status: z.enum(articleStatuses).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});

const articleBodySchema = z.object({
  title: z.string().trim().min(5).max(250),
  content: z.string().trim().min(20).max(50000),
  status: z.enum(articleStatuses).default("DRAFT"),
  categoryIds: z.array(z.coerce.number().int().positive()).min(1).max(10),
});

export const createArticleSchema = articleBodySchema.transform((value) => ({
  ...value,
  categoryIds: [...new Set(value.categoryIds)],
}));

export const updateArticleSchema = articleBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one article field must be provided",
  })
  .transform((value) => ({
    ...value,
    ...(value.categoryIds
      ? { categoryIds: [...new Set(value.categoryIds)] }
      : {}),
  }));
