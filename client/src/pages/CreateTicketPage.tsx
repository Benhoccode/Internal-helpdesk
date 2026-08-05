import { CircleHelp } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { createTicket, getCategories } from '../api/ticket-api'
import type { Category, TicketPriority } from '../types'

export function CreateTicketPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('MEDIUM')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getCategories()
      .then(({ categories: data }) => setCategories(data))
      .catch(() => setError('Không thể tải danh mục'))
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { ticket } = await createTicket({
        title,
        description,
        categoryId: Number(categoryId),
        priority,
      })
      navigate(`/tickets/${ticket.id}`)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'Không thể tạo yêu cầu')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-stack form-page">
      <div className="breadcrumbs"><Link to="/">Bảng điều khiển</Link><span>/</span><Link to="/tickets">Yêu cầu</Link><span>/</span><strong>Tạo yêu cầu</strong></div>
      <div className="page-heading"><h1>Tạo yêu cầu mới</h1><p>Cung cấp thông tin cụ thể để bộ phận hỗ trợ xử lý nhanh hơn.</p></div>

      <form className="panel ticket-form" onSubmit={handleSubmit}>
        <label htmlFor="title">Tiêu đề yêu cầu <span>*</span></label>
        <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={5} maxLength={200} placeholder="Tóm tắt ngắn gọn vấn đề" required />

        <div className="form-grid">
          <div><label htmlFor="category">Danh mục <span>*</span></label><select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required><option value="">Chọn một danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          <div><label htmlFor="priority">Mức độ ưu tiên <span>*</span></label><select id="priority" value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority)} required><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option></select></div>
        </div>

        <label htmlFor="description">Mô tả chi tiết <span>*</span></label>
        <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={5000} rows={9} placeholder="Bao gồm thông báo lỗi, các bước tái tạo và những cách khắc phục bạn đã thử..." required />
        <p className="form-help"><CircleHelp size={16} /> Tránh mô tả mơ hồ như “Máy bị hỏng”.</p>

        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions"><Link className="secondary-button" to="/tickets">Hủy</Link><button className="primary-button" disabled={submitting}>{submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}</button></div>
      </form>
    </div>
  )
}
