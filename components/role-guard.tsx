"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

type Role = "student" | "teacher" | "admin"

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: Role[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!profile || !allowedRoles.includes(profile.role)) {
        router.replace("/dashboard")
      }
    }
  }, [profile, loading, router, allowedRoles])

  if (loading || !profile || !allowedRoles.includes(profile.role)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
