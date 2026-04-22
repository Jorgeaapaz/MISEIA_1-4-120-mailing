'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'

const DEFAULT_HTML = `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px">
  <h2 style="color:#4F46E5">Hola, {{name}}!</h2>
  <p>Este es un mensaje de prueba para {{email}}.</p>
  <p>Saludos,<br>El equipo</p>
</div>`

export default function NuevaPlantillaPage() {
  const router = useRouter()
  const { authHeader } = useGlobal()
  const [form, setForm] = useState({ name: '', subject: 'Hola {{name}}', htmlBody: DEFAULT_HTML })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/plantillas/${data._id}/preview`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <Link href="/plantillas" className="text-indigo-600 hover:underline text-sm">← Plantillas</Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-6">Nueva plantilla</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la plantilla *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Bienvenida"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asunto *</label>
            <input type="text" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            HTML del cuerpo <span className="text-gray-400 font-normal">(usa {'{{variable}}'} para personalización)</span>
          </label>
          <textarea
            required rows={16} value={form.htmlBody}
            onChange={(e) => setForm({ ...form, htmlBody: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
