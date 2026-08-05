import { priorityLabels, statusLabels } from '../../data/navigation'
import type { TicketPriority, TicketStatus } from '../../types'

interface StatusBadgeProps {
  readonly value: TicketStatus | TicketPriority
  readonly kind?: 'status' | 'priority'
}

export function StatusBadge({
  value,
  kind = 'status',
}: Readonly<StatusBadgeProps>) {
  const label =
    kind === 'status'
      ? statusLabels[value as TicketStatus]
      : priorityLabels[value as TicketPriority]

  return (
    <span className={`badge badge--${value.toLowerCase()}`}>{label}</span>
  )
}
