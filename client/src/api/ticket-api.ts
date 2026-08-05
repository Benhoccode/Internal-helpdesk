import { apiRequest } from './client'
import type {
  Category,
  DashboardStatistics,
  Pagination,
  Ticket,
  TicketPriority,
  TicketStatus,
} from '../types'

export interface TicketFilters {
  readonly search?: string
  readonly status?: TicketStatus | ''
  readonly priority?: TicketPriority | ''
  readonly categoryId?: number | ''
  readonly page?: number
  readonly limit?: number
}

export interface CreateTicketInput {
  readonly title: string
  readonly description: string
  readonly categoryId: number
  readonly priority: TicketPriority
}

export interface UpdateTicketInput {
  readonly status?: TicketStatus
  readonly priority?: TicketPriority
  readonly categoryId?: number
  readonly assigneeId?: number | null
  readonly note?: string
}

export function getCategories() {
  return apiRequest<{ categories: Category[] }>('/categories')
}

export function getTickets(filters: TicketFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== undefined) params.set(key, String(value))
  })
  const query = params.size ? `?${params.toString()}` : ''
  return apiRequest<{ tickets: Ticket[]; pagination: Pagination }>(
    `/tickets${query}`,
  )
}

export function getTicket(id: number) {
  return apiRequest<{ ticket: Ticket }>(`/tickets/${id}`)
}

export function createTicket(input: CreateTicketInput) {
  return apiRequest<{ ticket: Ticket }>('/tickets', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateTicket(id: number, input: UpdateTicketInput) {
  return apiRequest<{ ticket: Ticket }>(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function addTicketComment(id: number, content: string) {
  return apiRequest(`/tickets/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export function getDashboardStatistics() {
  return apiRequest<{ statistics: DashboardStatistics }>(
    '/dashboard/statistics',
  )
}
