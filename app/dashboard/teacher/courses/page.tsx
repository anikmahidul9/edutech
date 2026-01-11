"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import { PlusCircle, BookOpen, Eye, Pencil, Users, TrendingUp, Star } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import Image from "next/image"

interface Course {
  id: string
  title: string
  description: string
  teacherId: string
  thumbnail?: string
  completionRate?: number
  totalStudents?: number
  category: string
  level: string
}

export default function TeacherCoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      if (!user) return
      try {
        const coursesRef = collection(db, "courses")
        const q = query(coursesRef, where("teacherId", "==", user.uid))
        const coursesSnap = await getDocs(q)

        const fetchedCourses: Course[] = []
        for (const doc of coursesSnap.docs) {
          const courseData = { id: doc.id, ...doc.data() } as Course

          // Fetch enrollments for this course
          const enrollmentsRef = collection(db, "enrollments")
          const enrollmentsQuery = query(enrollmentsRef, where("courseId", "==", courseData.id))
          const enrollmentsSnap = await getDocs(enrollmentsQuery)
          const totalStudents = enrollmentsSnap.size

          // Calculate completed students
          const completedStudents = enrollmentsSnap.docs.filter(
            (enrollmentDoc) => enrollmentDoc.data().progress === 100
          ).length

          const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0

          fetchedCourses.push({
            ...courseData,
            totalStudents,
            completionRate: parseFloat(completionRate.toFixed(2)), // Round to 2 decimal places
          })
        }
        setCourses(fetchedCourses)
      } catch (error) {
        console.error("Error fetching courses: ", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchCourses()
    }
  }, [user])

  const difficultyColors: Record<string, string> = {
    Beginner: "bg-green-100 text-green-800",
    Intermediate: "bg-blue-100 text-blue-800",
    Advanced: "bg-purple-100 text-purple-800",
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <Button asChild>
          <Link href="/dashboard/teacher/courses/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create New Course
          </Link>
        </Button>
      </div>

      {loading ? (
        <p>Loading courses...</p>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No courses created yet.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating your first course.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/teacher/courses/new">Create Course</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              {/* Course Image */}
              <div className="relative h-40 w-full overflow-hidden">
                <Image
                  src={course.thumbnail || "/placeholder.svg"}
                  alt={course.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {course.category}
                </span>
              </div>

              {/* Course Content */}
              <CardContent className="p-5 space-y-4">
                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {course.description}
                </p>

                {/* Course Stats */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{course.totalStudents || 0} Students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${difficultyColors[course.level]}`}>
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
                    <span>Completion:</span>
                    <span className="font-semibold text-foreground">{course.completionRate}%</span>
                  </div>
                  <Progress value={course.completionRate} className="h-2 [&>div]:bg-primary" />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/teacher/courses/edit/${course.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/courses/${course.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
