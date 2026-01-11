"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { CourseCard } from "@/components/course-card"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface Course {
  id: string
  title: string
  category: string
  description: string;
  level: string;
  teacherId: string;
  youtubePlaylistLink: string;
  thumbnail?: string;
  resources?: string[];
  departmentId?: string;
}

export default function MyCoursesPage() {
  const { user } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEnrolledCourses() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const enrollmentsRef = collection(db, "enrollments")
        const q = query(enrollmentsRef, where("userId", "==", user.uid))
        const enrollmentsSnap = await getDocs(q)

        const courseIds = enrollmentsSnap.docs.map(doc => doc.data().courseId)
        
        if (courseIds.length > 0) {
          const coursesRef = collection(db, "courses")
          const coursesQuery = query(coursesRef, where("__name__", "in", courseIds))
          const coursesSnap = await getDocs(coursesQuery)

          const fetchedCourses: Course[] = coursesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Course[]
          setEnrolledCourses(fetchedCourses)
        }
      } catch (error) {
        console.error("Error fetching enrolled courses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEnrolledCourses()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">My Courses</h1>

      {enrolledCourses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">You haven&apos;t enrolled in any courses yet.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore our courses and start your learning journey!
          </p>
          <Button asChild className="mt-6">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
