import { Menu, PocketKnife } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, SidebarContent } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export function AppLayout() {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-svh">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar with a drawer; hidden once the sidebar appears. */}
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-sidebar px-3 py-2 text-sidebar-foreground md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-64 bg-sidebar p-0 text-sidebar-foreground"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <PocketKnife className="h-5 w-5 text-primary" />
          <span className="font-semibold">Swiss Developers Knife</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
