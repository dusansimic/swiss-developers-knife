import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { tools } from '@/lib/tools'
import { Home } from '@/pages/home'

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        {tools.map((tool) => (
          <Route
            key={tool.id}
            path={tool.path}
            element={
              <Suspense
                fallback={
                  <div className="text-sm text-muted-foreground">Loading…</div>
                }
              >
                <tool.component />
              </Suspense>
            }
          />
        ))}
      </Route>
    </Routes>
  )
}
