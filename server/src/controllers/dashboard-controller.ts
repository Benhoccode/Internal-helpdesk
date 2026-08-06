import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import { TicketStatus, UserRole } from "../generated/prisma/client.js";

export async function getDashboardStatistics(
  request: Request,
  response: Response,
) {
  const accessFilter =
    request.user!.role === UserRole.EMPLOYEE
      ? { creatorId: request.user!.id }
      : {};

  const [total, open, inProgress, resolved, closed, grouped, recentTickets] =
    await Promise.all([
      prisma.ticket.count({ where: accessFilter }),
      prisma.ticket.count({
        where: { ...accessFilter, status: TicketStatus.OPEN },
      }),
      prisma.ticket.count({
        where: { ...accessFilter, status: TicketStatus.IN_PROGRESS },
      }),
      prisma.ticket.count({
        where: { ...accessFilter, status: TicketStatus.RESOLVED },
      }),
      prisma.ticket.count({
        where: { ...accessFilter, status: TicketStatus.CLOSED },
      }),
      prisma.ticket.groupBy({
        by: ["categoryId"],
        where: accessFilter,
        _count: { _all: true },
        orderBy: { _count: { categoryId: "desc" } },
      }),
      prisma.ticket.findMany({
        where: accessFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          creator: { select: { id: true, fullName: true } },
          assignee: { select: { id: true, fullName: true } },
          category: true,
        },
      }),
    ]);

  const categories = await prisma.category.findMany({
    where: { id: { in: grouped.map((item) => item.categoryId) } },
    select: { id: true, name: true },
  });
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  );

  response.json({
    statistics: {
      total,
      open,
      inProgress,
      resolved,
      closed,
      byCategory: grouped.map((item) => ({
        id: item.categoryId,
        name: categoryNames.get(item.categoryId) ?? "Unknown",
        count: item._count._all,
      })),
      recentTickets,
    },
  });
}
