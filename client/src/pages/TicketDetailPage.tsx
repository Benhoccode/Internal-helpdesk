import { CalendarDays, MessageSquare, Send, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { addTicketComment, getCategories, getTicket, updateTicket } from '../api/ticket-api'
import { StatusBadge } from '../components/ui/StatusBadge'
import { priorityLabels, statusLabels } from '../data/navigation'
import { useAuth } from '../hooks/use-auth'
import type { Category, Ticket, TicketPriority, TicketStatus } from '../types'
import { formatDate, formatTicketId, getInitials } from '../utils/format'

export function TicketDetailPage() {
  const { id } = useParams()
  const ticketId = Number(id)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  const refreshTicket = useCallback(async () => {
    try {
      const result = await getTicket(ticketId)
      setTicket(result.ticket)
    } catch {
      setError('Không thể tải yêu cầu hoặc bạn không có quyền truy cập')
    }
  }, [ticketId])

  useEffect(() => {
    let active = true
    getTicket(ticketId)
      .then((result) => {
        if (active) setTicket(result.ticket)
      })
      .catch(() => {
        if (active) setError('Không thể tải yêu cầu hoặc bạn không có quyền truy cập')
      })
    return () => { active = false }
  }, [ticketId])
  useEffect(() => { if (user?.role === 'ADMIN') getCategories().then(({ categories: data }) => setCategories(data)).catch(() => undefined) }, [user?.role])

  const updateField = async (input: { status?: TicketStatus; priority?: TicketPriority; categoryId?: number; assigneeId?: number | null }) => {
    setSaving(true)
    setError('')
    try {
      const result = await updateTicket(ticketId, input)
      setTicket(result.ticket)
    } catch { setError('Không thể cập nhật yêu cầu') }
    finally { setSaving(false) }
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!comment.trim()) return
    setSaving(true)
    try {
      await addTicketComment(ticketId, comment)
      setComment('')
      await refreshTicket()
    } catch { setError('Không thể gửi bình luận') }
    finally { setSaving(false) }
  }

  if (error && !ticket) return <div className="form-error">{error}</div>
  if (!ticket) return <div className="state-message">Đang tải chi tiết yêu cầu...</div>

  return (
    <div className="page-stack">
      <div className="breadcrumbs"><Link to="/tickets">Danh sách yêu cầu</Link><span>/</span><strong>{formatTicketId(ticket.id)}</strong></div>
      {error && <div className="form-error">{error}</div>}
      <div className="ticket-detail-grid">
        <div className="ticket-detail-main">
          <article className="panel ticket-content">
            <div className="ticket-kicker"><strong>{formatTicketId(ticket.id)}</strong><StatusBadge value={ticket.status} /><StatusBadge value={ticket.priority} kind="priority" /></div>
            <h1>{ticket.title}</h1>
            <div className="ticket-description"><h3>Mô tả</h3><p>{ticket.description}</p></div>
          </article>

          <article className="panel activity-panel">
            <h2><MessageSquare size={22} /> Hoạt động & Bình luận</h2>
            <div className="comments-list">
              {ticket.comments?.map((item) => <div className="comment" key={item.id}><span className="avatar">{getInitials(item.author.fullName)}</span><div><div className="comment__meta"><strong>{item.author.fullName}</strong><time>{formatDate(item.createdAt)}</time></div><p>{item.content}</p></div></div>)}
              {ticket.comments?.length === 0 && <p className="muted-text">Chưa có bình luận.</p>}
            </div>
            <form className="comment-form" onSubmit={submitComment}><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Viết phản hồi hoặc bổ sung thông tin..." rows={3} /><button className="primary-button" disabled={saving || !comment.trim()}><Send size={17} /> Gửi bình luận</button></form>
          </article>

          <article className="panel history-panel"><h2>Lịch sử trạng thái</h2>{ticket.statusHistory?.map((item) => <div className="history-item" key={item.id}><span /><div><strong>{item.fromStatus ? statusLabels[item.fromStatus] : 'Khởi tạo'} → {statusLabels[item.toStatus]}</strong><small>{item.changedBy.fullName} · {formatDate(item.createdAt)}</small>{item.note && <p>{item.note}</p>}</div></div>)}</article>
        </div>

        <aside className="ticket-detail-sidebar">
          <section className="panel detail-controls"><h2>Chi tiết yêu cầu</h2>
            {user?.role === 'ADMIN' ? <>
              <label>Trạng thái<select disabled={saving} value={ticket.status} onChange={(event) => void updateField({ status: event.target.value as TicketStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Mức độ ưu tiên<select disabled={saving} value={ticket.priority} onChange={(event) => void updateField({ priority: event.target.value as TicketPriority })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Người xử lý<select disabled={saving} value={ticket.assigneeId ?? ''} onChange={(event) => void updateField({ assigneeId: event.target.value ? Number(event.target.value) : null })}><option value="">Chưa giao</option><option value={user.id}>Giao cho tôi</option>{ticket.assignee && ticket.assignee.id !== user.id && <option value={ticket.assignee.id}>{ticket.assignee.fullName}</option>}</select></label>
              <label>Danh mục<select disabled={saving} value={ticket.categoryId} onChange={(event) => void updateField({ categoryId: Number(event.target.value) })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            </> : <div className="detail-readonly"><div><span>Trạng thái</span><StatusBadge value={ticket.status} /></div><div><span>Ưu tiên</span><StatusBadge value={ticket.priority} kind="priority" /></div><div><span>Danh mục</span><strong>{ticket.category.name}</strong></div></div>}
          </section>
          <section className="panel requester-card"><h2>Người yêu cầu</h2><div className="requester-card__user"><span className="avatar avatar--large">{getInitials(ticket.creator.fullName)}</span><div><strong>{ticket.creator.fullName}</strong><small>{ticket.creator.email}</small></div></div></section>
          <section className="panel metadata-card"><div><CalendarDays size={18} /><span>Đã tạo</span><strong>{formatDate(ticket.createdAt)}</strong></div><div><UserRound size={18} /><span>Người xử lý</span><strong>{ticket.assignee?.fullName ?? 'Chưa giao'}</strong></div></section>
        </aside>
      </div>
    </div>
  )
}
