'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Plantilla, WithId } from '@/lib/types'

export default function PlantillasPage() {
  const { authHeader } = useGlobal()
  const [plantillas, setPlantillas] = useState<WithId<Plantilla>[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/plantillas', { headers: authHeader() })
    const data = await res.json()
    if (Array.isArray(data)) setPlantillas(data)
    setLoading(false)
  }, [authHeader])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta plantilla?')) return
    await fetch(`/api/plantillas/${id}`, { method: 'DELETE', headers: authHeader() })
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas</h1>
          <p className="text-sm text-gray-500">{plantillas.length} plantillas</p>
        </div>
        <Link href="/plantillas/nueva">
          <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
            + Nueva plantilla
          </button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm mt-12">Cargando…</div>
      ) : plantillas.length === 0 ? (
        <div className="text-center mt-16">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-500 text-sm">No hay plantillas. ¡Crea la primera!</p>
          <Link href="/plantillas/nueva">
            <button className="mt-4 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              Crear plantilla
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((p) => (
            <div key={String(p._id)} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{p.name}</h3>
              </div>
              <p className="text-sm text-gray-500 truncate mb-3">Asunto: {p.subject}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {p.variables?.map((v) => (
                  <span key={v} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
              <div className="flex gap-2 border-t border-gray-100 pt-3">
                <Link href={`/plantillas/${p._id}`} className="flex-1">
                  <button className="w-full text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition">
                    Editar
                  </button>
                </Link>
                <Link href={`/plantillas/${p._id}/preview`} className="flex-1">
                  <button className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                    Preview
                  </button>
                </Link>
                <button onClick={() => handleDelete(String(p._id))}
                  className="text-sm text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
