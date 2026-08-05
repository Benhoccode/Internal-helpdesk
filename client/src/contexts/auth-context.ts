import { createContext } from 'react'
import type { User } from '../types'

export interface AuthContextValue {
  readonly user: User | null
  readonly isLoading: boolean
  readonly login: (email: string, password: string) => Promise<void>
  readonly logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
