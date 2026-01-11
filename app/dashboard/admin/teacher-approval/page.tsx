"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

import {
  Loader2,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Users,
} from "lucide-react"
import { toast } from "sonner"

interface TeacherRequest {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  createdAt: string
  isApproved: boolean
}

export default function TeacherApprovalPage() {
  const [pendingTeachers, setPendingTeachers] = useState<TeacherRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const fetchPendingTeachers = async () => {
    setLoading(true)
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "teacher"),
        where("isApproved", "==", false)
      )
      const snapshot = await getDocs(q)

      const teachers = snapshot.docs.map((d) => ({
        uid: d.id,
        ...d.data(),
      })) as TeacherRequest[]

      setPendingTeachers(teachers)
    } catch {
      toast.error("Failed to fetch teacher requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPendingTeachers()
  }, [])

  const handleApproval = async (teacherId: string, approve: boolean) => {
    setUpdatingUserId(teacherId)
    try {
      await updateDoc(doc(db, "users", teacherId), {
        isApproved: approve,
      })
      toast.success(
        `Teacher ${approve ? "approved" : "rejected"} successfully`
      )
      fetchPendingTeachers()
    } catch {
      toast.error("Action failed. Please try again.")
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div className="rounded-2xl border bg-gradient-to-r from-yellow-400 to-yellow-200 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow">
            <GraduationCap className="h-7 w-7 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Teacher Approval
            </h1>
            <p className="text-sm text-gray-700">
              Review and manage teacher account requests
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {pendingTeachers.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 rounded-2xl p-12 text-center shadow-sm">
          <Users className="h-12 w-12 text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-800">
            No pending requests
          </h3>
          <p className="text-sm text-muted-foreground">
            All teachers are approved at the moment
          </p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pendingTeachers.map((teacher) => (
            <Card
              key={teacher.uid}
              className="group rounded-2xl border-l-4 border-l-yellow-400 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Teacher Info */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-14 w-14 border">
                    <AvatarImage src={teacher.photoURL} />
                    <AvatarFallback className="bg-yellow-100 text-lg text-yellow-700">
                      {teacher.displayName?.charAt(0) ||
                        teacher.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <p className="text-base font-semibold text-gray-900">
                      {teacher.displayName || teacher.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {teacher.email}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        Pending Approval
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(teacher.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                    onClick={() => handleApproval(teacher.uid, true)}
                    disabled={updatingUserId === teacher.uid}
                  >
                    {updatingUserId === teacher.uid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span className="ml-2">Approve</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleApproval(teacher.uid, false)}
                    disabled={updatingUserId === teacher.uid}
                  >
                    {updatingUserId === teacher.uid ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="ml-2">Reject</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
