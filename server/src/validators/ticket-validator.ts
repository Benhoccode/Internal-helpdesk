import { z } from "zod";

const ticketStatuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;
const ticketPriorities = ["LOW", "MEDIUM", "HIGH"] as const;

export const ticketIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createTicketSchema = z.object({
  title: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(5000),
  categoryId: z.coerce.number().int().positive(),
  priority: z.enum(ticketPriorities).default("MEDIUM"),
});

export const ticketQuerySchema = z.object({
  status: z.enum(ticketStatuses).optional(),
  priority: z.enum(ticketPriorities).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const updateTicketSchema = z
  .object({
    status: z.enum(ticketStatuses).optional(),
    priority: z.enum(ticketPriorities).optional(),
    categoryId: z.coerce.number().int().positive().optional(),
    assigneeId: z.coerce.number().int().positive().nullable().optional(),
    note: z.string().trim().max(1000).optional(),
  })
  .refine(
    ({ status, priority, categoryId, assigneeId }) =>
      status !== undefined ||
      priority !== undefined ||
      categoryId !== undefined ||
      assigneeId !== undefined,
    { message: "At least one ticket field must be provided" },
  )
  .refine(({ note, status }) => !note || status !== undefined, {
    message: "A history note can only be added with a status update",
    path: ["note"],
  });

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});
