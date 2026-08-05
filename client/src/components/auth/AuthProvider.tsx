import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getCurrentUser, loginRequest } from '../../api/auth-api'
import { AuthContext } from '../../contexts/auth-context'
import type { User } from '../../types'

interface AuthProviderProps {
  readonly children: ReactNode
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(() =>
    Boolean(localStorage.getItem('helpdesk_token')),
  )

  useEffect(() => {
    const token = localStorage.getItem('helpdesk_token')
    if (!token) return

    getCurrentUser()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => localStorage.removeItem('helpdesk_token'))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password)
    localStorage.setItem('helpdesk_token', result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('helpdesk_token')
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
