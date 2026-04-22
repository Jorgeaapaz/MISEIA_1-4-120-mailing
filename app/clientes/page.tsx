'use client'

import { useEffect, useState, useCallback } from 'react'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'
import type { Cliente, WithId } from '@/lib/types'

export default function ClientesPage() {
  const { authHeader } = useGlobal()
  const [clientes, setClientes] = useState<WithId<Cliente>[]>([])
  const [search, setSearch] = useState('')
  const [tag, setTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [allTags, setAllTags] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (tag) params.set('tag', tag)
    const res = await fetch(`/api/clientes?${params}`, { headers: authHeader() })
    const data = await res.json()
    if (Array.isArray(data)) {
      setClientes(data)
      const tags = new Set<string>()
      data.forEach((c: WithId<Cliente>) => c.tags?.forEach((t) => tags.add(t)))
      setAllTags(Array.from(tags))
    }
    setLoading(false)
  }, [authHeader, search, tag])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm('¿Dar de baja este cliente?')) return
    await fetch(`/api/clientes/${id}`, { method: 'DELETE', headers: authHeader() })
    load()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-500">{clientes.length} clientes activos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/clientes/importar">
            <button className="border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:border-indigo-400 transition">
              Importar CSV
            </button>
          </Link>
          <Link href="/clientes/nuevo">
            <button className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
              + Nuevo cliente
            </button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los tags</option>
          {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Cargando…</div>
        ) : clientes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No hay clientes. ¡Crea el primero!</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tags</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Creado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clientes.map((c) => (
                <tr key={String(c._id)} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags?.map((t) => (
                        <span key={t} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/clientes/${c._id}`}>
                      <button className="text-indigo-600 hover:underline text-xs mr-3">Editar</button>
                    </Link>
                    <button
                      onClick={() => handleDelete(String(c._id))}
                      className="text-red-500 hover:underline text-xs"
                    >
                      Dar de baja
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
