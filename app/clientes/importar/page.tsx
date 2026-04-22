'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'

export default function ImportarClientesPage() {
  const router = useRouter()
  const { authHeader } = useGlobal()
  const [csv, setCsv] = useState('')
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/api/clientes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', ...authHeader() },
        body: csv,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <Link href="/clientes" className="text-indigo-600 hover:underline text-sm">← Clientes</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Importar clientes CSV</h1>
      <p className="text-sm text-gray-500 mb-6">Formato: <code className="bg-gray-100 px-1 rounded">nombre, email, tag1, tag2</code> — una fila por línea, sin cabecera.</p>

      <form onSubmit={handleImport} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <textarea
          rows={10}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={'Ana García, ana@example.com, newsletter, vip\nPedro López, pedro@example.com, newsletter'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
        {result && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
            ✓ {result.imported} importados, {result.skipped} omitidos
          </div>
        )}
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {loading ? 'Importando…' : 'Importar'}
          </button>
          {result && (
            <button type="button" onClick={() => router.push('/clientes')}
              className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:border-gray-400 transition">
              Ver clientes
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
