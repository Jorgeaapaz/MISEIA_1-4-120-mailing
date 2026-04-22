'use client'

import { useEffect, useState } from 'react'
import { useGlobal } from '@/context/GlobalContext'
import Link from 'next/link'

interface Stats {
  clientes: number
  plantillas: number
  campanas: number
  enviados: number
}

export default function DashboardPage() {
  const { authHeader, user } = useGlobal()
  const [stats, setStats] = useState<Stats>({ clientes: 0, plantillas: 0, campanas: 0, enviados: 0 })

  useEffect(() => {
    const h = authHeader()
    Promise.all([
      fetch('/api/clientes', { headers: h }).then((r) => r.json()),
      fetch('/api/plantillas', { headers: h }).then((r) => r.json()),
      fetch('/api/campanas', { headers: h }).then((r) => r.json()),
    ]).then(([clientes, plantillas, campanas]) => {
      const enviados = Array.isArray(campanas)
        ? campanas.reduce((acc: number, c: { logs?: { status: string }[] }) => acc + (c.logs?.filter((l) => l.status === 'sent').length || 0), 0)
        : 0
      setStats({
        clientes: Array.isArray(clientes) ? clientes.length : 0,
        plantillas: Array.isArray(plantillas) ? plantillas.length : 0,
        campanas: Array.isArray(campanas) ? campanas.length : 0,
        enviados,
      })
    })
  }, [authHeader])

  const cards = [
    { label: 'Clientes activos', value: stats.clientes, icon: '👥', href: '/clientes', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { label: 'Plantillas', value: stats.plantillas, icon: '📄', href: '/plantillas', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { label: 'Campañas', value: stats.campanas, icon: '📨', href: '/campanas', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
    { label: 'Emails enviados', value: stats.enviados, icon: '✓', href: '/campanas', color: 'bg-green-50 text-green-700 border-green-100' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Hola, {user?.email} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Aquí tienes un resumen de tu actividad</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <div className={`rounded-xl border p-5 cursor-pointer hover:shadow-sm transition ${c.color}`}>
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-3xl font-bold">{c.value}</div>
              <div className="text-sm font-medium mt-1 opacity-80">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Acciones rápidas</h2>
      <div className="flex flex-wrap gap-3">
        <Link href="/clientes/nuevo">
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
            + Nuevo cliente
          </button>
        </Link>
        <Link href="/plantillas/nueva">
          <button className="bg-white border border-gray-300 hover:border-indigo-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition">
            + Nueva plantilla
          </button>
        </Link>
        <Link href="/campanas/nueva">
          <button className="bg-white border border-gray-300 hover:border-indigo-400 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition">
            + Nueva campaña
          </button>
        </Link>
      </div>
    </div>
  )
}
