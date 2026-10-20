import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../api/client'
import { useAuth } from '../hooks/use-auth'
import '../components/Operations.css'

export function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirmation) { setError('Mật khẩu xác nhận không khớp.'); return }
    setBusy(true); setError('')
    try {
      await apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword: current, newPassword: password }) })
      logout()
      navigate('/login', { state: { passwordChanged: true } })
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu.') }
    finally { setBusy(false) }
  }
  return <div className="page-stack form-page"><h1>Đổi mật khẩu</h1>
    <p>Sau khi đổi mật khẩu, mọi phiên cũ sẽ hết hiệu lực. Bạn cần đăng nhập lại.</p>
    <form className="panel operations-panel" onSubmit={submit}>
      <label>Mật khẩu hiện tại<input type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required /></label>
      <label>Mật khẩu mới<input type="password" autoComplete="new-password" minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} required /></label>
      <label>Xác nhận mật khẩu mới<input type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required /></label>
      <small>Mật khẩu mới từ 12 ký tự, tối đa 72 byte.</small>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? 'Đang lưu…' : 'Đổi mật khẩu'}</button>
    </form>
  </div>
}
