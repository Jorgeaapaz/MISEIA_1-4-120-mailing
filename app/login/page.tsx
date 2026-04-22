'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSent(true)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-xl mb-4">
              <span className="text-2xl">✉</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Mailing SaaS</h1>
            <p className="text-gray-500 text-sm mt-1">Envía emails que convierten</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl">✓</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Revisa tu email</h2>
              <p className="text-gray-500 text-sm">
                Enviamos un enlace de acceso a <strong>{email}</strong>. Abre MailHog en{' '}
                <a href="http://localhost:8025" target="_blank" className="text-indigo-600 hover:underline">
                  localhost:8025
                </a>
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-sm text-indigo-600 hover:underline"
              >
                Usar otro email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                {loading ? 'Enviando…' : 'Enviar enlace de acceso'}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          Sin contraseñas. Acceso seguro por magic link.
        </p>
      </div>
    </div>
  )
}
