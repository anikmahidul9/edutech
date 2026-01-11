"use client"

import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { StudentDashboard } from "@/components/student-dashboard"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role === "admin") {
        router.replace("/dashboard/admin")
      } else if (profile.role === "teacher") {
        router.replace("/dashboard/teacher")
      }
    }
  }, [profile, authLoading, router])

  // While auth is loading, or if we are about to redirect, show a spinner.
  if (authLoading || !profile || profile.role !== "student") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Only render the student dashboard if the role is 'student'
  return <StudentDashboard />
}
