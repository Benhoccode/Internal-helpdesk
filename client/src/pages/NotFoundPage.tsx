import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return <div className="empty-feature"><h1>404</h1><p>Trang bạn tìm không tồn tại.</p><Link className="primary-button" to="/">Về bảng điều khiển</Link></div>
}
