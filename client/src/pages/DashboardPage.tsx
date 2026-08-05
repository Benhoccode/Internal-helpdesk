import { CircleCheck, CircleDot, Clock3, TicketCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStatistics } from '../api/ticket-api'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useAuth } from '../hooks/use-auth'
import type { DashboardStatistics } from '../types'
import { formatTicketId } from '../utils/format'

export function DashboardPage() {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    getDashboardStatistics()
      .then(({ statistics: data }) => setStatistics(data))
      .catch(() => setError('Không thể tải số liệu bảng điều khiển'))
  }, [])

  const cards = [
    { label: 'Tổng số yêu cầu', value: statistics?.total ?? '—', icon: TicketCheck, tone: 'blue' },
    { label: 'Đang mở', value: statistics?.open ?? '—', icon: CircleDot, tone: 'red' },
    { label: 'Đang xử lý', value: statistics?.inProgress ?? '—', icon: Clock3, tone: 'orange' },
    { label: 'Đã giải quyết', value: statistics?.resolved ?? '—', icon: CircleCheck, tone: 'green' },
  ]

  return (
    <div className="page-stack">
      <div className="page-heading page-heading--actions">
        <div><h1>Chào mừng, {user?.fullName}</h1><p>Dưới đây là tình hình hỗ trợ hiện tại.</p></div>
        <Link className="primary-button" to="/tickets/new">+ Tạo yêu cầu mới</Link>
      </div>

      {error && <div className="form-error">{error}</div>}
      <section className="stat-grid">
        {cards.map((card) => (
          <article className="stat-card" key={card.label}>
            <div><span>{card.label}</span><strong>{card.value}</strong></div>
            <span className={`stat-card__icon stat-card__icon--${card.tone}`}><card.icon size={25} /></span>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <div className="panel__header"><h2>Yêu cầu gần đây</h2><Link to="/tickets">Xem tất cả</Link></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>ID</th><th>Tiêu đề</th><th>Ưu tiên</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {statistics?.recentTickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td><Link to={`/tickets/${ticket.id}`}>{formatTicketId(ticket.id)}</Link></td>
                    <td>{ticket.title}</td>
                    <td><StatusBadge value={ticket.priority} kind="priority" /></td>
                    <td><StatusBadge value={ticket.status} /></td>
                  </tr>
                ))}
                {statistics?.recentTickets.length === 0 && <tr><td colSpan={4}>Chưa có yêu cầu nào.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel category-panel">
          <div className="panel__header"><h2>Phân bố yêu cầu</h2></div>
          <div className="category-bars">
            {statistics?.byCategory.map((category) => {
              const percent = statistics.total ? Math.round((category.count / statistics.total) * 100) : 0
              return (
                <div className="category-bar" key={category.id}>
                  <div><span>{category.name}</span><strong>{category.count}</strong></div>
                  <span className="category-bar__track"><span style={{ width: `${percent}%` }} /></span>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </div>
  )
}
