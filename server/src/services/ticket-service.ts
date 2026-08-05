import { prisma } from "../config/prisma.js";
import {
  TicketStatus,
  UserRole,
  type TicketPriority,
} from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

export const ticketDetailInclude = {
  creator: { select: { id: true, fullName: true, email: true } },
  assignee: { select: { id: true, fullName: true, email: true } },
  category: true,
  comments: {
    orderBy: { createdAt: "asc" as const },
    include: { author: { select: { id: true, fullName: true, role: true } } },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
    include: { changedBy: { select: { id: true, fullName: true } } },
  },
} as const;

export async function ensureCategoryExists(categoryId: number) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) throw new AppError(404, "Category not found");
  return category;
}

export async function ensureValidAssignee(assigneeId: number) {
  const assignee = await prisma.user.findFirst({
    where: { id: assigneeId, role: UserRole.ADMIN, isActive: true },
  });
  if (!assignee) throw new AppError(400, "Assignee must be an active admin");
  return assignee;
}

export async function findAccessibleTicket(
  ticketId: number,
  user: { id: number; role: UserRole },
) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      ...(user.role === UserRole.EMPLOYEE ? { creatorId: user.id } : {}),
    },
    include: ticketDetailInclude,
  });

  if (!ticket) throw new AppError(404, "Ticket not found");
  return ticket;
}

export function resolvedAtForStatus(
  currentStatus: TicketStatus,
  nextStatus: TicketStatus | undefined,
) {
  if (!nextStatus || nextStatus === currentStatus) return undefined;
  if (nextStatus === TicketStatus.RESOLVED) return new Date();
  if (currentStatus === TicketStatus.RESOLVED) return null;
  return undefined;
}

export type TicketListFilters = {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: number;
  search?: string;
  page: number;
  limit: number;
};
