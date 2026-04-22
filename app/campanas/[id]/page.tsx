'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Campana, RecipientLog, WithId } from '@/lib/types'

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  sending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function CampanaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { authHeader } = useGlobal()
  const [campana, setCampana] = useState<WithId<Campana> | null>(null)

  useEffect(() => {
    fetch(`/api/campanas/${id}`, { headers: authHeader() })
      .then((r) => r.json())
      .then((data: WithId<Campana>) => setCampana(data))
  }, [id, authHeader])

  if (!campana) return <div className="p-8 text-sm text-gray-400">Cargando…</div>

  const sent = campana.logs?.filter((l) => l.status === 'sent').length || 0
  const failed = campana.logs?.filter((l) => l.status === 'failed').length || 0

  return (
    <div className="p-8">
      <Link href="/campanas" className="text-indigo-600 hover:underline text-sm">← Campañas</Link>
      <div className="flex items-center gap-3 mt-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{campana.name}</h1>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[campana.status]}`}>
          {campana.status}
        </span>
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{campana.logs?.length || 0}</div>
          <div className="text-xs text-gray-500 mt-1">Destinatarios</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{sent}</div>
          <div className="text-xs text-gray-500 mt-1">Enviados</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-500">{failed}</div>
          <div className="text-xs text-gray-500 mt-1">Fallidos</div>
        </div>
      </div>

      {/* Logs */}
      {campana.logs?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">Log de envíos</div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Destinatario</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Email</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Estado</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Fecha</th>
                <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campana.logs.map((log: RecipientLog, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">{log.recipientName}</td>
                  <td className="px-4 py-2 text-gray-600">{log.recipientEmail}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {log.status === 'sent' ? '✓ enviado' : '✗ fallido'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">
                    {new Date(log.sentAt).toLocaleString('es-ES')}
                  </td>
                  <td className="px-4 py-2 text-red-500 text-xs">{log.error || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {campana.logs?.length === 0 && (
        <div className="text-center mt-8 text-gray-400 text-sm">
          No hay logs. Esta campaña aún no se ha enviado.
        </div>
      )}
    </div>
  )
}
