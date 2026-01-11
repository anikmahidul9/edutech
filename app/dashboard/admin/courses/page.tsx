"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Eye, CheckCircle, XCircle, Loader2, BookOpen as BookOpenIcon, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Course {
  id: string
  title: string
  teacherId: string
  status: "pending" | "published" | "rejected"
  thumbnail?: string
  description: string
}

interface CourseWithTeacher extends Course {
  teacherName: string
}

export default function CourseModerationPage() {
  const [courses, setCourses] = useState<CourseWithTeacher[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null)

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const coursesRef = collection(db, "courses")
      const q = query(coursesRef)
      const querySnapshot = await getDocs(q)

      const fetchedCourses: Course[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[]

      const coursesWithTeachers: CourseWithTeacher[] = await Promise.all(
        fetchedCourses.map(async (course) => {
          const teacherDoc = await getDoc(doc(db, "users", course.teacherId))
          const teacherName = teacherDoc.exists() ? teacherDoc.data().displayName : "Unknown"
          return { ...course, teacherName }
        })
      )
      setCourses(coursesWithTeachers)
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to fetch courses.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleUpdateCourseStatus = async (courseId: string, newStatus: Course['status']) => {
    setUpdatingCourseId(courseId)
    try {
      const courseRef = doc(db, "courses", courseId)
      await updateDoc(courseRef, {
        status: newStatus,
      })
      toast.success(`Course status updated to "${newStatus}" successfully!`)
      fetchCourses() // Refresh the list
    } catch (error) {
      console.error("Error updating course status:", error)
      toast.error("Failed to update course status.")
    } finally {
      setUpdatingCourseId(null)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }
    setUpdatingCourseId(courseId)
    try {
      const courseRef = doc(db, "courses", courseId)
      await deleteDoc(courseRef)
      toast.success("Course deleted successfully!")
      fetchCourses() // Refresh the list
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course.")
    } finally {
      setUpdatingCourseId(null)
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
      <h1 className="text-3xl font-bold">Course Moderation</h1>

      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No courses found.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no courses available for moderation.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium">{course.title}</TableCell>
                    <TableCell>{course.teacherName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          course.status === "published"
                            ? "default"
                            : course.status === "pending"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {course.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Approve Course"
                              onClick={() => handleUpdateCourseStatus(course.id, "published")}
                              disabled={updatingCourseId === course.id}
                            >
                              {updatingCourseId === course.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              title="Reject Course"
                              onClick={() => handleUpdateCourseStatus(course.id, "rejected")}
                              disabled={updatingCourseId === course.id}
                            >
                              {updatingCourseId === course.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </Button>
                          </>
                        )}
                        {course.status === "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            title="Unpublish Course"
                            onClick={() => handleUpdateCourseStatus(course.id, "pending")}
                            disabled={updatingCourseId === course.id}
                          >
                            {updatingCourseId === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="ml-1">Unpublish</span>
                          </Button>
                        )}
                        <Button variant="outline" size="sm" title="View Course" asChild>
                          <Link href={`/courses/${course.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          title="Delete Course"
                          onClick={() => handleDeleteCourse(course.id)}
                          disabled={updatingCourseId === course.id}
                        >
                          {updatingCourseId === course.id ? (
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