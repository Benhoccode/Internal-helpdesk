import { TicketStatus } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

export const statusTransitions: Record<TicketStatus, readonly TicketStatus[]> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: ["IN_PROGRESS"],
};

export function assertStatusTransition(current: TicketStatus, next?: TicketStatus) {
  if (next && next !== current && !statusTransitions[current].includes(next)) {
    throw new AppError(409, "Không thể chuyển trạng thái này. Vui lòng làm theo quy trình xử lý.");
  }
}

export function resolvedAtForStatus(current: TicketStatus, next?: TicketStatus) {
  if (!next || next === current) return undefined;
  if (next === TicketStatus.RESOLVED) return new Date();
  if (next === TicketStatus.IN_PROGRESS) return null;
  // Closing preserves the original resolution timestamp.
  return undefined;
}
