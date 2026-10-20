import type { Prisma } from "../generated/prisma/client.js";

export async function notifyTicket(
  tx: Prisma.TransactionClient,
  ticket: { id: number; creatorId: number; assigneeId: number | null },
  actorId: number,
  message: string,
  allAdmins = false,
) {
  const recipients = await tx.user.findMany({
    where: {
      isActive: true, id: { not: actorId },
      OR: [
        { id: ticket.creatorId },
        ...(allAdmins || ticket.assigneeId === null
          ? [{ role: "ADMIN" as const }]
          : [{ id: ticket.assigneeId, role: "ADMIN" as const }]),
      ],
    },
    select: { id: true },
  });
  if (recipients.length) await tx.notification.createMany({
    data: recipients.map(user => ({ recipientId: user.id, ticketId: ticket.id, message })),
  });
}
