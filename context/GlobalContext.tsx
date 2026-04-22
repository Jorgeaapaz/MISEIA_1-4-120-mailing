'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface AuthUser {
  email: string
  tenantId: string
  tenantName: string
  role: 'admin' | 'member'
}

interface GlobalState {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (token: string, user: AuthUser) => void
  logout: () => void
  authHeader: () => Record<string, string>
}

const GlobalContext = createContext<GlobalState | null>(null)

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const authHeader = useCallback((): Record<string, string> => {
    if (!token) return {}
    return { Authorization: `Bearer ${token}` }
  }, [token])

  return (
    <GlobalContext.Provider value={{ user, token, loading, login, logout, authHeader }}>
      {children}
    </GlobalContext.Provider>
  )
}

export function useGlobal(): GlobalState {
  const ctx = useContext(GlobalContext)
  if (!ctx) throw new Error('useGlobal must be used inside GlobalProvider')
  return ctx
}
