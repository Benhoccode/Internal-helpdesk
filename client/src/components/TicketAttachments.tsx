import { useEffect, useRef, useState, type FormEvent } from 'react'
import { apiRequest } from '../api/client'
import './TicketAttachments.css'

interface Attachment {
  id: number
  originalName: string
  size: number
  createdAt: string
  uploadedBy: { fullName: string }
}

export function TicketAttachments({ ticketId }: { ticketId: number }) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const base = `/tickets/${ticketId}/attachments`

  useEffect(() => {
    let active = true
    apiRequest<{ attachments: Attachment[] }>(base)
      .then(data => { if (active) setAttachments(data.attachments) })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Không thể tải danh sách tệp.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [base])

  async function upload(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    const files = Array.from(input.current?.files ?? [])
    if (!files.length || files.length > 5 || files.some(file => !file.size || file.size > 10 * 1024 * 1024)) {
      setError('Chọn từ 1 đến 5 tệp, mỗi tệp không rỗng và tối đa 10 MB.')
      return
    }
    const data = new FormData()
    files.forEach(file => data.append('files', file))
    setBusy(true)
    try {
      const result = await apiRequest<{ attachments: Attachment[] }>(base, { method: 'POST', body: data })
      setAttachments(previous => [...previous, ...result.attachments])
      if (input.current) input.current.value = ''
      setMessage(`Đã tải lên ${result.attachments.length} tệp.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải tệp lên.')
    } finally { setBusy(false) }
  }

  async function download(id: number) {
    setError('')
    try {
      const { url } = await apiRequest<{ url: string }>(`${base}/${id}/download`)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.rel = 'noopener noreferrer'
      anchor.referrerPolicy = 'no-referrer'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải xuống.')
    }
  }

  return <section className="panel attachment-panel" aria-labelledby="attachments-heading">
    <h2 id="attachments-heading">Tệp đính kèm</h2>
    <p>Ảnh chụp lỗi, PDF hoặc nhật ký TXT/LOG. Tối đa 5 tệp/lần, 10 MB/tệp.</p>
    <p className="attachment-hint">Không gửi mật khẩu, khóa API hoặc thông tin nhạy cảm trong tệp.</p>
    {error && <p role="alert" className="error-message">{error}</p>}
    {message && <p role="status">{message}</p>}
    {loading ? <p>Đang tải danh sách tệp…</p> : attachments.length === 0 ? <p>Chưa có tệp đính kèm.</p> :
      <ul className="attachment-list">{attachments.map(file => <li key={file.id}>
        <div><strong>{file.originalName}</strong>
          <small>{(file.size / 1024).toFixed(1)} KB · {file.uploadedBy.fullName} · {new Date(file.createdAt).toLocaleString('vi-VN')}</small>
        </div>
        <button type="button" onClick={() => void download(file.id)}>Tải xuống</button>
      </li>)}</ul>}
    <form onSubmit={upload} className="attachment-form">
      <label htmlFor="attachment-files">Chọn tệp đính kèm</label>
      <input id="attachment-files" ref={input} type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,.log" disabled={busy} />
      <button type="submit" disabled={busy || loading}>{busy ? 'Đang tải lên…' : 'Tải tệp lên'}</button>
    </form>
  </section>
}
