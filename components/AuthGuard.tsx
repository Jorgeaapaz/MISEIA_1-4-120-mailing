'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useGlobal()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-indigo-600 text-sm font-medium animate-pulse">Cargando…</div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
