import { RoleGuard } from "@/components/role-guard"

export default function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleGuard allowedRoles={["teacher"]}>{children}</RoleGuard>
}
