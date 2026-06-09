import AppSidebar from '@/components/layout/AppSidebar'
import Topbar from '@/components/layout/Topbar'
import { SidebarProvider } from '@/hooks/use-sidebar'
import { createSupabaseServer } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const role = (user?.app_metadata?.role as string | undefined) ?? 'admin'

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar role={role} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar role={role} />
          <main
            id="main-content"
            className="flex-1 overflow-y-auto overflow-x-hidden"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
