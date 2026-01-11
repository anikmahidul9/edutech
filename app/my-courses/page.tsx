
"use client"

import { useEffect, useState } from "react"
import { CourseCard } from "@/components/course-card"
import { getUserCourses } from "@/lib/data/get-user-courses"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

export default function MyCoursesPage() {
  const { user, loading: authLoading } = useAuth()
  const [courses, setCourses] = useState<any[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    async function fetchCourses() {
      if (user?.uid) {
        console.log("MyCoursesPage: Fetching courses for uid:", user.uid)
        const fetchedCourses = await getUserCourses(user.uid)
        setCourses(fetchedCourses)
        console.log("MyCoursesPage: Fetched courses:", fetchedCourses)
      } else {
        console.log("MyCoursesPage: User not logged in or uid not available.")
      }
      setLoadingCourses(false)
    }

    if (!authLoading) {
      fetchCourses()
    }
  }, [user, authLoading])

  if (authLoading || loadingCourses) {
    console.log("MyCoursesPage: Loading state - authLoading:", authLoading, "loadingCourses:", loadingCourses)
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  console.log("MyCoursesPage: Rendering with courses:", courses)
  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold tracking-tight mb-8">My Courses</h1>
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-2xl font-semibold mb-4">No Courses Yet</h2>
          <p className="text-muted-foreground">You haven't enrolled in any courses yet. Explore our courses and start learning!</p>
        </div>
      )}
    </main>
  )
}
