import { Search } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, getTickets, type TicketFilters } from '../api/ticket-api'
import { StatusBadge } from '../components/ui/StatusBadge'
import type { Category, Pagination, Ticket, TicketPriority, TicketStatus } from '../types'
import { formatDate, formatTicketId } from '../utils/format'

export function TicketListPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filters, setFilters] = useState<TicketFilters>({ page: 1, limit: 10 })
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { getCategories().then(({ categories: data }) => setCategories(data)).catch(() => undefined) }, [])
  useEffect(() => {
    let active = true
    getTickets(filters)
      .then((result) => {
        if (!active) return
        setTickets(result.tickets)
        setPagination(result.pagination)
        setError('')
      })
      .catch(() => {
        if (active) setError('Không thể tải danh sách yêu cầu')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [filters])

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    setFilters((current) => ({ ...current, search: searchInput, page: 1 }))
  }

  return (
    <div className="page-stack">
      <div className="page-heading page-heading--actions">
        <div><h1>Danh sách yêu cầu</h1><p>Quản lý và theo dõi các yêu cầu hỗ trợ nội bộ.</p></div>
        <Link className="primary-button" to="/tickets/new">+ Tạo yêu cầu</Link>
      </div>

      <section className="filter-bar">
        <form className="search-input" onSubmit={submitSearch}><Search size={19} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo mã, tiêu đề..." /></form>
        <select value={filters.status ?? ''} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as TicketStatus | '', page: 1 }))}>
          <option value="">Tất cả trạng thái</option><option value="OPEN">Đang mở</option><option value="IN_PROGRESS">Đang xử lý</option><option value="RESOLVED">Đã giải quyết</option><option value="CLOSED">Đã đóng</option>
        </select>
        <select value={filters.priority ?? ''} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value as TicketPriority | '', page: 1 }))}>
          <option value="">Tất cả ưu tiên</option><option value="HIGH">Cao</option><option value="MEDIUM">Trung bình</option><option value="LOW">Thấp</option>
        </select>
        <select value={filters.categoryId ?? ''} onChange={(event) => setFilters((current) => ({ ...current, categoryId: event.target.value ? Number(event.target.value) : '', page: 1 }))}>
          <option value="">Tất cả danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </section>

      {error && <div className="form-error">{error}</div>}
      <section className="panel ticket-table-panel">
        <div className="table-scroll"><table>
          <thead><tr><th>Mã số</th><th>Tiêu đề</th><th>Danh mục</th><th>Ưu tiên</th><th>Trạng thái</th><th>Người xử lý</th><th>Ngày tạo</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7}>Đang tải danh sách...</td></tr>}
            {!loading && tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td><Link to={`/tickets/${ticket.id}`}>{formatTicketId(ticket.id)}</Link></td>
                <td className="ticket-title-cell"><Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link></td>
                <td>{ticket.category.name}</td><td><StatusBadge value={ticket.priority} kind="priority" /></td><td><StatusBadge value={ticket.status} /></td><td>{ticket.assignee?.fullName ?? 'Chưa giao'}</td><td>{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
            {!loading && tickets.length === 0 && <tr><td colSpan={7}>Không tìm thấy yêu cầu phù hợp.</td></tr>}
          </tbody>
        </table></div>
      </section>
      {pagination && pagination.totalPages > 1 && <nav className="pagination" aria-label="Phân trang"><button disabled={pagination.page === 1} onClick={() => setFilters((current) => ({ ...current, page: pagination.page - 1 }))}>Trước</button><span>Trang {pagination.page} / {pagination.totalPages}</span><button disabled={pagination.page === pagination.totalPages} onClick={() => setFilters((current) => ({ ...current, page: pagination.page + 1 }))}>Sau</button></nav>}
    </div>
  )
}
