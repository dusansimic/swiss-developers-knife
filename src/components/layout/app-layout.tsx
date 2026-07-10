import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'

export function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
