import { Bell, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import './Operations.css'

interface Notification {
  id: number
  ticketId: number
  message: string
  readAt: string | null
  createdAt: string
}
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [data, setData] = useState<{ notifications: Notification[]; unreadCount: number; total: number }>({ notifications: [], unreadCount: 0, total: 0 })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  useEffect(() => {
    let active = true
    let fetching = false
    async function load() {
      if (fetching) return
      fetching = true
      try {
        const result = await apiRequest<typeof data>(`/notifications?page=${page}`)
        if (active) { setData(result); setError('') }
      } catch {
        if (active) setError('Không thể tải thông báo. Hãy thử lại.')
      } finally { fetching = false }
    }
    void load()
    const timer = window.setInterval(() => { if (!document.hidden) void load() }, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [page, refresh])
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])
  async function markRead(notification?: Notification) {
    setBusy(true)
    try {
      await apiRequest(notification ? `/notifications/${notification.id}/read` : '/notifications/read-all', { method: 'PATCH' })
      setRefresh(value => value + 1)
      if (notification) { setOpen(false); navigate(`/tickets/${notification.ticketId}`) }
    } catch { setError('Không thể cập nhật thông báo. Hãy thử lại.') }
    finally { setBusy(false) }
  }
  return <div className="notification-container">
    <button type="button" className="icon-button notification-trigger" aria-label={`Thông báo, ${data.unreadCount} chưa đọc`} aria-expanded={open} aria-controls="notification-panel"
      onClick={() => { setOpen(value => !value); setRefresh(value => value + 1) }}>
      <Bell size={21} />{data.unreadCount > 0 && <span className="notification-count">{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>}
    </button>
    {open && <section id="notification-panel" className="notification-panel panel" aria-label="Danh sách thông báo">
      <header><h2>Thông báo</h2><button className="icon-button" aria-label="Đóng thông báo" onClick={() => setOpen(false)}><X size={18} /></button></header>
      <button className="secondary-button" disabled={busy || !data.unreadCount} onClick={() => void markRead()}>Đánh dấu tất cả đã đọc</button>
      {error && <p role="alert">{error} <button onClick={() => setRefresh(value => value + 1)}>Thử lại</button></p>}
      {!error && !data.notifications.length && <p>Chưa có thông báo.</p>}
      <ul>{data.notifications.map(item => <li key={item.id}>
        <button disabled={busy} className={item.readAt ? 'notification-item' : 'notification-item unread'} onClick={() => void markRead(item)}>
          <span>{!item.readAt && <strong>● </strong>}{item.message}</span><small>{new Date(item.createdAt).toLocaleString('vi-VN')}</small>
        </button>
      </li>)}</ul>
      <footer><button className="secondary-button" disabled={page === 1 || busy} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page}</span><button className="secondary-button" disabled={page * 20 >= data.total || busy} onClick={() => setPage(value => value + 1)}>Sau</button></footer>
    </section>}
  </div>
}
