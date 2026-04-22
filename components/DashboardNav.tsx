'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useGlobal } from '@/context/GlobalContext'

const NAV = [
  { href: '/dashboard', label: 'Inicio', icon: '⊞' },
  { href: '/clientes', label: 'Clientes', icon: '👥' },
  { href: '/plantillas', label: 'Plantillas', icon: '📄' },
  { href: '/campanas', label: 'Campañas', icon: '📨' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useGlobal()

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-indigo-700 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-indigo-600">
        <span className="text-xl font-bold tracking-tight">✉ Mailing SaaS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-900 text-white'
                  : 'text-indigo-100 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-indigo-600">
        <p className="text-xs text-indigo-300 truncate">{user?.email}</p>
        <p className="text-xs text-indigo-400 truncate mb-2">{user?.tenantName}</p>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-indigo-200 hover:text-white transition-colors"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  )
}
