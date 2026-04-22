'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Plantilla, WithId } from '@/lib/types'

export default function EditarPlantillaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { authHeader } = useGlobal()
  const [form, setForm] = useState({ name: '', subject: '', htmlBody: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch(`/api/plantillas/${id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data: WithId<Plantilla>) => {
        setForm({ name: data.name, subject: data.subject, htmlBody: data.htmlBody })
        setFetching(false)
      })
  }, [id, authHeader])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/plantillas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/plantillas/${id}/preview`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="p-8 text-sm text-gray-400">Cargando…</div>

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/plantillas" className="text-indigo-600 hover:underline text-sm">← Plantillas</Link>
        <span className="text-gray-300">|</span>
        <Link href={`/plantillas/${id}/preview`} className="text-indigo-600 hover:underline text-sm">Preview</Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar plantilla</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
            <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HTML del cuerpo</label>
          <textarea rows={16} required value={form.htmlBody} onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div className="flex gap-2">
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {loading ? 'Guardando…' : 'Guardar y ver preview'}
          </button>
          <Link href="/plantillas">
            <button type="button" className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:border-gray-400 transition">
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
