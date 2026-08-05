import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/use-auth'
import { LoadingState } from '../ui/LoadingState'

interface ProtectedRouteProps {
  readonly redirectTo?: string
}

export function ProtectedRoute({
  redirectTo = '/login',
}: Readonly<ProtectedRouteProps>) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingState label="Đang kiểm tra phiên đăng nhập..." />
  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
