import DashboardNav from '@/components/DashboardNav'
import AuthGuard from '@/components/AuthGuard'

export default function CampanasLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <DashboardNav />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </AuthGuard>
  )
}
