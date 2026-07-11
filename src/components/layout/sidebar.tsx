import { PocketKnife } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ModeToggle } from '@/components/mode-toggle'
import { tools } from '@/lib/tools'
import { cn } from '@/lib/utils'

/** The sidebar's inner content, reused by the desktop aside and mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <NavLink
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-2 border-b px-5 py-4 font-semibold"
      >
        <PocketKnife className="h-6 w-6 text-primary" />
        <span className="leading-tight">
          Swiss Developers
          <br />
          Knife
        </span>
      </NavLink>

      <nav className="flex-1 overflow-y-auto p-3">
        <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Tools
        </p>
        <ul className="space-y-1">
          {tools.map((tool) => (
            <li key={tool.id}>
              <NavLink
                to={tool.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <tool.icon className="h-4 w-4" />
                {tool.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center justify-between border-t p-3">
        <span className="text-xs text-muted-foreground">Theme</span>
        <ModeToggle />
      </div>
    </div>
  )
}

/** Persistent sidebar, shown from the `md` breakpoint up. */
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 self-start border-r bg-sidebar text-sidebar-foreground md:block">
      <SidebarContent />
    </aside>
  )
}
