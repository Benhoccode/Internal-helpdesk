import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../hooks/use-auth'

interface LoginLocationState {
  readonly from?: string
}

export function LoginPage() {
  const [email, setEmail] = useState('employee@helpdesk.local')
  const [password, setPassword] = useState('Employee@123')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      const state = location.state as LoginLocationState | null
      navigate(state?.from ?? '/', { replace: true })
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Không thể kết nối tới máy chủ',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="brand brand--login">
          <span className="brand__mark">HP</span>
          <span><strong>Helpdesk Pro</strong><small>Hỗ trợ nội bộ</small></span>
        </div>
        <h1>Chào mừng trở lại</h1>
        <p>Đăng nhập để gửi yêu cầu và theo dõi tiến trình hỗ trợ của bạn.</p>
      </section>

      <form className="login-card" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <div className="input-with-icon">
          <Mail size={19} />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <label htmlFor="password">Mật khẩu</label>
        <div className="input-with-icon">
          <LockKeyhole size={19} />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="input-icon-button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        <button className="primary-button login-button" disabled={submitting}>
          {submitting ? 'Đang đăng nhập...' : 'Đăng nhập vào hệ thống'}
        </button>

        <div className="demo-accounts">
          <strong>Tài khoản dùng thử</strong>
          <span>Employee: employee@helpdesk.local / Employee@123</span>
          <span>Admin: admin@helpdesk.local / Admin@123</span>
        </div>
      </form>
      <footer className="login-footer"><ShieldCheck size={16} /> Kết nối nội bộ an toàn</footer>
    </main>
  )
}
