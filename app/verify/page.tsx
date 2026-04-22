'use client'

import { Suspense } from 'react'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'

function VerifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const { login } = useGlobal()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setErrorMsg('Token no encontrado en la URL')
      return
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        login(data.token, data.user)
        router.replace('/dashboard')
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.message)
      })
  }, [params, login, router])

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full border border-gray-100 text-center">
      {status === 'loading' ? (
        <>
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-indigo-600 text-xl">⟳</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Verificando acceso…</h2>
          <p className="text-gray-500 text-sm mt-1">Un momento, por favor.</p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">✗</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Error de acceso</h2>
          <p className="text-red-600 text-sm mt-2">{errorMsg}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Volver al login
          </button>
        </>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center">
      <Suspense fallback={
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full border border-gray-100 text-center">
          <div className="text-indigo-600 text-sm animate-pulse">Cargando…</div>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
