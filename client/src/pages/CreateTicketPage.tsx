import { CircleHelp } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
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
  const [createdId, setCreatedId] = useState<number | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const submitLock = useRef(false)
  const navigate = useNavigate()

  useEffect(() => {
    getCategories()
      .then(({ categories: data }) => setCategories(data))
      .catch(() => setError('Không thể tải danh mục'))
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitLock.current) return
    setError('')
    const files = Array.from(fileInput.current?.files ?? [])
    if (files.length > 5 || files.some(file => !file.size || file.size > 10 * 1024 * 1024 || !/\.(png|jpe?g|pdf|txt|log)$/i.test(file.name))) {
      setError('Chọn tối đa 5 tệp PNG/JPG/PDF/TXT/LOG, mỗi tệp không rỗng và tối đa 10 MB.')
      return
    }
    submitLock.current = true
    setSubmitting(true)
    let ticketId = createdId
    try {
      if (!ticketId) {
        const { ticket } = await createTicket({
          title, description, categoryId: Number(categoryId), priority,
        })
        ticketId = ticket.id
        setCreatedId(ticket.id)
      }
      if (files.length) {
        const data = new FormData()
        files.forEach(file => data.append('files', file))
        await apiRequest(`/tickets/${ticketId}/attachments`, { method: 'POST', body: data })
      }
      navigate(`/tickets/${ticketId}`)
    } catch (caughtError) {
      const detail = caughtError instanceof Error ? caughtError.message : 'Không thể gửi yêu cầu'
      setError(ticketId ? `Yêu cầu #${ticketId} đã được tạo, nhưng chưa xác nhận được tải tệp thành công. Bạn có thể mở yêu cầu để kiểm tra hoặc thử tải lại. ${detail}` : detail)
    } finally {
      submitLock.current = false
      setSubmitting(false)
    }
  }

  return (
    <div className="page-stack form-page">
      <div className="breadcrumbs"><Link to="/">Bảng điều khiển</Link><span>/</span><Link to="/tickets">Yêu cầu</Link><span>/</span><strong>Tạo yêu cầu</strong></div>
      <div className="page-heading"><h1>Tạo yêu cầu mới</h1><p>Cung cấp thông tin cụ thể để bộ phận hỗ trợ xử lý nhanh hơn.</p></div>

      <form className="panel ticket-form" onSubmit={handleSubmit}>
        <fieldset disabled={submitting || createdId !== null} style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: 'grid', gap: '.7rem' }}>
        <label htmlFor="title">Tiêu đề yêu cầu <span>*</span></label>
        <input id="title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={5} maxLength={200} placeholder="Tóm tắt ngắn gọn vấn đề" required />

        <div className="form-grid">
          <div><label htmlFor="category">Danh mục <span>*</span></label><select id="category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required><option value="">Chọn một danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
          <div><label htmlFor="priority">Mức độ ưu tiên <span>*</span></label><select id="priority" value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority)} required><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option></select></div>
        </div>

        <label htmlFor="description">Mô tả chi tiết <span>*</span></label>
        <textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} maxLength={5000} rows={9} placeholder="Bao gồm thông báo lỗi, các bước tái tạo và những cách khắc phục bạn đã thử..." required />
        <p className="form-help"><CircleHelp size={16} /> Tránh mô tả mơ hồ như “Máy bị hỏng”.</p>
        </fieldset>

        <label htmlFor="create-attachments">Tệp đính kèm (không bắt buộc)</label>
        <input id="create-attachments" ref={fileInput} type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,.log" disabled={submitting} />
        <p className="form-help">Tối đa 5 tệp, 10 MB/tệp. Tệp sẽ tự tải lên khi gửi yêu cầu. Không đính kèm mật khẩu hoặc khóa API.</p>

        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="form-actions">
          {!submitting && <Link className="secondary-button" to={createdId ? `/tickets/${createdId}` : '/tickets'}>{createdId ? 'Mở yêu cầu đã tạo' : 'Hủy'}</Link>}
          <button className="primary-button" disabled={submitting}>{submitting ? 'Đang gửi yêu cầu và tệp...' : createdId ? 'Tiếp tục / thử tải tệp lại' : 'Gửi yêu cầu'}</button>
        </div>
      </form>
    </div>
  )
}
