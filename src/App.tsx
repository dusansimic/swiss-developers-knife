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
          <Route key={tool.id} path={tool.path} element={<tool.component />} />
        ))}
      </Route>
    </Routes>
  )
}
