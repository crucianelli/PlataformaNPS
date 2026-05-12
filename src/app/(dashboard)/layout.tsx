import AppSidebar from '@/components/layout/AppSidebar'
import Topbar from '@/components/layout/Topbar'
import { SidebarProvider } from '@/hooks/use-sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />
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
