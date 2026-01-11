import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AuthGuard } from "@/components/auth-guard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
