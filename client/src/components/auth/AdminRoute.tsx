import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/use-auth'

interface AdminRouteProps {
  readonly redirectTo?: string
}

export function AdminRoute({
  redirectTo = '/',
}: Readonly<AdminRouteProps>) {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') return <Navigate to={redirectTo} replace />
  return <Outlet />
}
