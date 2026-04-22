'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Plantilla, WithId } from '@/lib/types'

export default function NuevaCampanaPage() {
  const router = useRouter()
  const { authHeader } = useGlobal()
  const [form, setForm] = useState({ name: '', plantillaId: '', segment: 'all' })
  const [plantillas, setPlantillas] = useState<WithId<Plantilla>[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const h = authHeader()
    Promise.all([
      fetch('/api/plantillas', { headers: h }).then((r) => r.json()),
      fetch('/api/clientes', { headers: h }).then((r) => r.json()),
    ]).then(([pls, cls]) => {
      if (Array.isArray(pls)) setPlantillas(pls)
      if (Array.isArray(cls)) {
        const tags = new Set<string>()
        cls.forEach((c: { tags?: string[] }) => c.tags?.forEach((t) => tags.add(t)))
        setAllTags(Array.from(tags))
      }
    })
  }, [authHeader])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campanas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push('/campanas')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <Link href="/campanas" className="text-indigo-600 hover:underline text-sm">← Campañas</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Nueva campaña</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la campaña *</label>
          <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Newsletter Abril 2026"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla *</label>
          <select required value={form.plantillaId} onChange={(e) => setForm({ ...form, plantillaId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Seleccionar plantilla…</option>
            {plantillas.map((p) => (
              <option key={String(p._id)} value={String(p._id)}>{p.name}</option>
            ))}
          </select>
          {plantillas.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              No hay plantillas. <Link href="/plantillas/nueva" className="underline">Crea una primero.</Link>
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Segmento de destinatarios</label>
          <select value={form.segment} onChange={(e) => setForm({ ...form, segment: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">Todos los clientes activos</option>
            {allTags.map((t) => <option key={t} value={t}>Tag: {t}</option>)}
          </select>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            {loading ? 'Creando…' : 'Crear campaña'}
          </button>
          <Link href="/campanas">
            <button type="button" className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:border-gray-400 transition">
              Cancelar
            </button>
          </Link>
        </div>
      </form>
    </div>
  )
}
