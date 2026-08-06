import type { Request, Response } from "express";
import { prisma } from "../config/prisma.js";
import {
  TicketStatus,
  UserRole,
  type Prisma,
} from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";
import {
  ensureCategoryExists,
  ensureValidAssignee,
  findAccessibleTicket,
  resolvedAtForStatus,
  ticketDetailInclude,
} from "../services/ticket-service.js";
import {
  createCommentSchema,
  createTicketSchema,
  ticketIdParamsSchema,
  ticketQuerySchema,
  updateTicketSchema,
} from "../validators/ticket-validator.js";

export async function createTicket(request: Request, response: Response) {
  const input = createTicketSchema.parse(request.body);
  await ensureCategoryExists(input.categoryId);

  const ticket = await prisma.$transaction(async (transaction) => {
    const createdTicket = await transaction.ticket.create({
      data: { ...input, creatorId: request.user!.id },
    });

    await transaction.ticketStatusHistory.create({
      data: {
        ticketId: createdTicket.id,
        changedById: request.user!.id,
        fromStatus: null,
        toStatus: TicketStatus.OPEN,
        note: "Ticket created",
      },
    });

    return transaction.ticket.findUniqueOrThrow({
      where: { id: createdTicket.id },
      include: ticketDetailInclude,
    });
  });

  response.status(201).json({ ticket });
}

export async function listTickets(request: Request, response: Response) {
  const filters = ticketQuerySchema.parse(request.query);
  const where: Prisma.TicketWhereInput = {
    ...(request.user!.role === UserRole.EMPLOYEE
      ? { creatorId: request.user!.id }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.search
      ? {
          OR: [
            { title: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        creator: { select: { id: true, fullName: true } },
        assignee: { select: { id: true, fullName: true } },
        category: true,
        _count: { select: { comments: true } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);

  response.json({
    tickets,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit),
    },
  });
}

export async function getTicket(request: Request, response: Response) {
  const { id } = ticketIdParamsSchema.parse(request.params);
  const ticket = await findAccessibleTicket(id, request.user!);
  response.json({ ticket });
}

export async function updateTicket(request: Request, response: Response) {
  const { id } = ticketIdParamsSchema.parse(request.params);
  const input = updateTicketSchema.parse(request.body);
  const currentTicket = await prisma.ticket.findUnique({ where: { id } });

  if (!currentTicket) {
    throw new AppError(404, "Ticket not found");
  }

  if (input.categoryId !== undefined) await ensureCategoryExists(input.categoryId);
  if (input.assigneeId !== undefined && input.assigneeId !== null) {
    await ensureValidAssignee(input.assigneeId);
  }

  const statusChanged =
    input.status !== undefined && input.status !== currentTicket.status;
  const { note: _note, ...ticketFields } = input;

  const ticket = await prisma.$transaction(async (transaction) => {
    await transaction.ticket.update({
      where: { id },
      data: {
        ...ticketFields,
        resolvedAt: resolvedAtForStatus(currentTicket.status, input.status),
      },
    });

    if (statusChanged) {
      await transaction.ticketStatusHistory.create({
        data: {
          ticketId: id,
          changedById: request.user!.id,
          fromStatus: currentTicket.status,
          toStatus: input.status!,
          note: input.note,
        },
      });
    }

    return transaction.ticket.findUniqueOrThrow({
      where: { id },
      include: ticketDetailInclude,
    });
  });

  response.json({ ticket });
}

export async function addComment(request: Request, response: Response) {
  const { id } = ticketIdParamsSchema.parse(request.params);
  const input = createCommentSchema.parse(request.body);
  await findAccessibleTicket(id, request.user!);

  const comment = await prisma.ticketComment.create({
    data: {
      content: input.content,
      ticketId: id,
      authorId: request.user!.id,
    },
    include: {
      author: { select: { id: true, fullName: true, role: true } },
    },
  });

  response.status(201).json({ comment });
}
