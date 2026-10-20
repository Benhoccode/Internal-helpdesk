import { useEffect, useRef, useState, type FormEvent } from 'react'
import { apiRequest } from '../api/client'
import { useAuth } from '../hooks/use-auth'
import type { User, UserRole } from '../types'
import '../components/Operations.css'

function ResetPasswordDialog({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close() }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirmation) { setError('Mật khẩu xác nhận không khớp.'); return }
    setBusy(true); setError('')
    try {
      await apiRequest(`/users/${user.id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) })
      onSuccess()
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể đặt lại mật khẩu.') }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="operations-dialog" onCancel={event => { if (busy) event.preventDefault(); else onClose() }} aria-labelledby="reset-title">
    <form className="operations-form" onSubmit={submit}>
      <h2 id="reset-title">Đặt lại mật khẩu</h2><p>{user.fullName} — {user.email}</p>
      <p>Các phiên cũ sẽ bị thu hồi. Chuyển mật khẩu cho người nhận qua kênh riêng và yêu cầu họ đổi lại.</p>
      <label>Mật khẩu mới<input type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label>Xác nhận mật khẩu<input type="password" autoComplete="new-password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      {error && <p role="alert">{error}</p>}
      <div className="operations-actions"><button className="primary-button" disabled={busy}>Lưu mật khẩu</button><button className="secondary-button" type="button" disabled={busy} onClick={onClose}>Hủy</button></div>
    </form>
  </dialog>
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'EMPLOYEE' as UserRole })
  useEffect(() => {
    let active = true
    apiRequest<{ users: User[]; total: number }>(`/users?page=${page}&search=${encodeURIComponent(query)}`)
      .then(result => { if (active) { setUsers(result.users); setTotal(result.total) } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Không thể tải tài khoản.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page, query, refresh])
  async function create(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify(form) })
      setForm({ fullName: '', email: '', password: '', role: 'EMPLOYEE' })
      setPage(1); setQuery(''); setSearch(''); setRefresh(value => value + 1)
      setMessage('Đã tạo tài khoản. Chuyển thông tin đăng nhập qua kênh riêng.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể tạo tài khoản.') }
    finally { setBusy(false) }
  }
  async function toggle(user: User) {
    if (!window.confirm(`${user.isActive ? 'Khóa' : 'Mở khóa'} tài khoản ${user.email}? Các phiên đăng nhập cũ sẽ bị thu hồi.`)) return
    setBusy(true); setError(''); setMessage('')
    try {
      await apiRequest(`/users/${user.id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive: !user.isActive }) })
      setRefresh(value => value + 1)
      setMessage('Đã cập nhật trạng thái tài khoản.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Không thể cập nhật tài khoản.') }
    finally { setBusy(false) }
  }
  return <div className="page-stack">
    <div className="page-heading"><h1>Quản lý tài khoản</h1><p>Tạo nhân viên, quản trị hỗ trợ và kiểm soát quyền đăng nhập.</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <section className="panel operations-panel"><h2>Tạo tài khoản</h2>
      <form onSubmit={create}>
        <div className="form-grid">
          <label>Họ tên<input minLength={2} maxLength={120} required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></label>
          <label>Email<input type="email" autoComplete="off" maxLength={255} required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
          <label>Mật khẩu ban đầu<input type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></label>
          <label>Vai trò<select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}><option value="EMPLOYEE">Nhân viên</option><option value="ADMIN">Quản trị hỗ trợ</option></select></label>
        </div>
        <small>Mật khẩu từ 12 ký tự, tối đa 72 byte. Quản trị hỗ trợ được xem mọi ticket và quản lý tài khoản.</small>
        <button className="primary-button" disabled={busy}>Tạo tài khoản</button>
      </form>
    </section>
    <section className="panel operations-panel"><h2>Danh sách tài khoản</h2>
      <form onSubmit={e => { e.preventDefault(); setPage(1); setQuery(search); setLoading(true); setRefresh(value => value + 1) }}>
        <label>Tìm theo tên hoặc email<input maxLength={100} value={search} onChange={e => setSearch(e.target.value)} /></label><button className="secondary-button">Tìm kiếm</button>
      </form>
      {loading ? <p>Đang tải…</p> : <div className="operations-table"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
        {users.map(user => <tr key={user.id}><td>{user.fullName}</td><td>{user.email}</td><td>{user.role === 'ADMIN' ? 'Quản trị hỗ trợ' : 'Nhân viên'}</td><td>{user.isActive ? 'Hoạt động' : 'Đã khóa'}</td><td><div className="operations-actions">
          <button className="secondary-button" disabled={busy || currentUser?.id === user.id} onClick={() => void toggle(user)}>{user.isActive ? 'Khóa' : 'Mở khóa'}</button>
          <button className="secondary-button" disabled={busy || currentUser?.id === user.id} onClick={() => setResetUser(user)}>Đặt lại mật khẩu</button>
        </div></td></tr>)}
        {!users.length && <tr><td colSpan={5}>Không có tài khoản phù hợp.</td></tr>}
      </tbody></table></div>}
      <div className="operations-actions"><button className="secondary-button" disabled={page === 1} onClick={() => setPage(value => value - 1)}>Trước</button><span>Trang {page} · {total} tài khoản</span><button className="secondary-button" disabled={page * 20 >= total} onClick={() => setPage(value => value + 1)}>Sau</button></div>
    </section>
    {resetUser && <ResetPasswordDialog user={resetUser} onClose={() => setResetUser(null)} onSuccess={() => { setResetUser(null); setMessage('Đã đặt lại mật khẩu và thu hồi các phiên cũ.') }} />}
  </div>
}
