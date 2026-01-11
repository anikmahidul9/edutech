"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, CheckCircle, XCircle, Loader2, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface UserProfile {
  uid: string
  email: string
  displayName: string
  role: "student" | "teacher" | "admin"
  isApproved?: boolean
  photoURL?: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, "users"))
      const querySnapshot = await getDocs(q)
      const fetchedUsers = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserProfile[]
      setUsers(fetchedUsers)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to fetch users.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleApproveReject = async (userId: string, approve: boolean) => {
    setUpdatingUserId(userId)
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        isApproved: approve,
      })
      toast.success(`User ${approve ? "approved" : "rejected"} successfully!`)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error(`Error ${approve ? "approving" : "rejecting"} user:`, error)
      toast.error(`Failed to ${approve ? "approve" : "reject"} user.`)
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleChangeRole = async (userId: string, newRole: UserProfile['role']) => {
    setUpdatingUserId(userId)
    try {
      const userRef = doc(db, "users", userId)
      await updateDoc(userRef, {
        role: newRole,
        // If changing to teacher, set isApproved to false (pending)
        // If changing from teacher, ensure isApproved is handled
        isApproved: newRole === "teacher" ? false : true,
      })
      toast.success(`User role updated to ${newRole} successfully!`)
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error("Error changing user role:", error)
      toast.error("Failed to change user role.")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return
    }
    setUpdatingUserId(userId)
    try {
      const userRef = doc(db, "users", userId)
      await deleteDoc(userRef)
      toast.success("User deleted successfully!")
      fetchUsers() // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error)
      toast.error("Failed to delete user.")
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">User Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No users found.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no registered users in the system.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || "/placeholder-user.jpg"} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.displayName || user.email}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(newRole: UserProfile['role']) => handleChangeRole(user.uid, newRole)}
                        disabled={updatingUserId === user.uid}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {user.role === "teacher" && user.isApproved === false ? (
                        <Badge variant="outline">Pending</Badge>
                      ) : (
                        <Badge variant="default">Approved</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === "teacher" && user.isApproved === false && (
                          <Button
                            variant="outline"
                            size="sm"
                            title="Approve Teacher"
                            onClick={() => handleApproveReject(user.uid, true)}
                            disabled={updatingUserId === user.uid}
                          >
                            {updatingUserId === user.uid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        )}
                        {user.role === "teacher" && user.isApproved === true && (
                          <Button
                            variant="outline"
                            size="sm"
                            title="Reject Teacher"
                            onClick={() => handleApproveReject(user.uid, false)}
                            disabled={updatingUserId === user.uid}
                          >
                            {updatingUserId === user.uid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          title="Delete User"
                          onClick={() => handleDeleteUser(user.uid)}
                          disabled={updatingUserId === user.uid}
                        >
                          {updatingUserId === user.uid ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}