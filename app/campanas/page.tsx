'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Campana, WithId } from '@/lib/types'

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  sending: 'Enviando',
  sent: 'Enviada',
  failed: 'Fallida',
}

export default function CampanasPage() {
  const { authHeader } = useGlobal()
  const [campanas, setCampanas] = useState<WithId<Campana>[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/campanas', { headers: authHeader() })
    const data = await res.json()
    if (Array.isArray(data)) setCampanas(data)
    setLoading(false)
  }, [authHeader])

  useEffect(() => { load() }, [load])

  async function handleSend(id: string) {
    if (!confirm('¿Enviar esta campaña a todos los destinatarios del segmento?')) return
    setSending(id)
    const res = await fetch(`/api/campanas/${id}/send`, { method: 'POST', headers: authHeader() })
    const data = await res.json()
    setSending(null)
    if (data.error) { alert(data.error); return }
    alert(`Enviados: ${data.sent}, Fallidos: ${data.failed}`)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta campaña?')) return
    await fetch(`/api/campanas/${id}`, { method: 'DELETE', headers: authHeader() })
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campañas</h1>
          <p className="text-sm text-gray-500">{campanas.length} campañas</p>
        </div>
        <Link href="/campanas/nueva">
          <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            + Nueva campaña
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm mt-12">Cargando…</div>
      ) : campanas.length === 0 ? (
        <div className="text-center mt-16">
          <div className="text-4xl mb-3">📨</div>
          <p className="text-gray-500 text-sm">No hay campañas. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Plantilla</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Segmento</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Enviados</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campanas.map((c) => {
                const sent = c.logs?.filter((l) => l.status === 'sent').length || 0
                const failed = c.logs?.filter((l) => l.status === 'failed').length || 0
                return (
                  <tr key={String(c._id)} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.plantillaName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                        {c.segment === 'all' ? 'Todos' : c.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[c.status]}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {c.logs?.length > 0 ? (
                        <span className="text-xs">
                          <span className="text-green-600">{sent} ✓</span>
                          {failed > 0 && <span className="text-red-500 ml-1">{failed} ✗</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/campanas/${c._id}`}>
                        <button className="text-indigo-600 hover:underline text-xs mr-3">Ver logs</button>
                      </Link>
                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleSend(String(c._id))}
                          disabled={sending === String(c._id)}
                          className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50 transition mr-2"
                        >
                          {sending === String(c._id) ? 'Enviando…' : 'Enviar'}
                        </button>
                      )}
                      {['draft', 'sent', 'failed'].includes(c.status) && (
                        <button onClick={() => handleDelete(String(c._id))} className="text-red-500 hover:underline text-xs">
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
