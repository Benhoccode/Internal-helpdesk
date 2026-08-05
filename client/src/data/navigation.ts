import {
  BookOpen,
  CirclePlus,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
} from 'lucide-react'
import type { UserRole } from '../types'

export interface NavigationItem {
  readonly label: string
  readonly to: string
  readonly icon: LucideIcon
  readonly roles?: UserRole[]
}

export const navigationItems: NavigationItem[] = [
  { label: 'Bảng điều khiển', to: '/', icon: LayoutDashboard },
  { label: 'Danh sách yêu cầu', to: '/tickets', icon: ListChecks },
  { label: 'Tạo yêu cầu', to: '/tickets/new', icon: CirclePlus },
  { label: 'Cơ sở kiến thức', to: '/knowledge', icon: BookOpen },
]

export const statusLabels = {
  OPEN: 'Đang mở',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
} as const

export const priorityLabels = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
} as const
