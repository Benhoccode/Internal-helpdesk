export type UserRole = 'EMPLOYEE' | 'ADMIN'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

export interface User {
  id: number
  fullName: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface Category {
  id: number
  name: string
  description: string | null
  _count?: { tickets: number }
}

export interface UserSummary {
  id: number
  fullName: string
  email?: string
  role?: UserRole
}

export interface TicketComment {
  id: number
  content: string
  authorId: number
  createdAt: string
  author: UserSummary
}

export interface TicketHistory {
  id: number
  fromStatus: TicketStatus | null
  toStatus: TicketStatus
  note: string | null
  createdAt: string
  changedBy: UserSummary
}

export interface Ticket {
  id: number
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  creatorId: number
  assigneeId: number | null
  categoryId: number
  creator: UserSummary
  assignee: UserSummary | null
  category: Category
  comments?: TicketComment[]
  statusHistory?: TicketHistory[]
  _count?: { comments: number }
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DashboardStatistics {
  total: number
  open: number
  inProgress: number
  resolved: number
  closed: number
  byCategory: Array<{ id: number; name: string; count: number }>
  recentTickets: Ticket[]
}

export interface ArticleCategoryLink {
  categoryId: number
  category: Category
}

export interface Article {
  id: number
  title: string
  slug: string
  content: string
  status: ArticleStatus
  authorId: number
  author: UserSummary
  categoryLinks: ArticleCategoryLink[]
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
