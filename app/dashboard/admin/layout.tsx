import { RoleGuard } from "@/components/role-guard"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>
}
