'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Cliente, WithId } from '@/lib/types'

export default function EditarClientePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { authHeader } = useGlobal()
  const [form, setForm] = useState({ name: '', email: '', tags: '', metadata: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/clientes/${id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data: WithId<Cliente>) => {
        setForm({
          name: data.name,
          email: data.email,
          tags: data.tags?.join(', ') || '',
          metadata: Object.entries(data.metadata || {}).map(([k, v]) => `${k}: ${v}`).join('\n'),
        })
        setFetching(false)
      })
  }, [id, authHeader])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const metadata: Record<string, string> = {}
      if (form.metadata.trim()) {
        form.metadata.split('\n').forEach((line) => {
          const [k, ...rest] = line.split(':')
          if (k && rest.length) metadata[k.trim()] = rest.join(':').trim()
        })
      }
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          metadata,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/clientes')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-sm text-gray-400">Cargando…</div>

  return (
    <div className="p-8 max-w-lg">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/clientes" className="text-indigo-600 hover:underline text-sm">← Clientes</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar cliente</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
          <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Metadata (clave: valor, uno por línea)</label>
          <textarea rows={3} value={form.metadata} onChange={(e) => setForm({ ...form, metadata: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </button>
          <Link href="/clientes">
            <button type="button" className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:border-gray-400 transition">
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
