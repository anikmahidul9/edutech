"use client"

import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Users, BarChart, Loader2 } from "lucide-react"

export function TeacherDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      if (!user) return
      try {
        const coursesRef = collection(db, "courses")
        const q = query(coursesRef, where("teacherId", "==", user.uid))
        const coursesSnap = await getDocs(q)
        const courseIds = coursesSnap.docs.map((doc) => doc.id)

        let totalStudents = 0
        let totalCompleted = 0
        const recentActivities: any[] = []
        const coursesWithStudentCounts: any[] = []

        if (courseIds.length > 0) {
          // Fetch all courses once to create a map for quick lookup
          const allCoursesSnap = await getDocs(query(coursesRef, where("__name__", "in", courseIds)));
          const courseMap = new Map(allCoursesSnap.docs.map(doc => [doc.id, doc.data()]));

          const enrollmentsRef = collection(db, "enrollments")
          const enrollmentsQuery = query(enrollmentsRef, where("courseId", "in", courseIds))
          const enrollmentsSnap = await getDocs(enrollmentsQuery)

          totalStudents = enrollmentsSnap.size
          for (const doc of enrollmentsSnap.docs) {
            const enrollment = doc.data()
            const courseData = courseMap.get(enrollment.courseId);

            if (enrollment.status === "completed") {
              totalCompleted++
            }
            
            // Populate recentActivities with actual course names
            if (courseData) {
              recentActivities.push({
                type: "enrollment",
                courseName: courseData.title,
                studentName: "A student", // Placeholder, would fetch from users collection
                date: enrollment.enrolledAt?.toDate() || new Date(),
              })
            }
          }

          coursesSnap.docs.forEach((courseDoc) => {
            const courseData = courseDoc.data()
            const studentCount = enrollmentsSnap.docs.filter(
              (enrollmentDoc) => enrollmentDoc.data().courseId === courseDoc.id
            ).length
            coursesWithStudentCounts.push({
              id: courseDoc.id,
              title: courseData.title,
              studentCount: studentCount,
            })
          })
        }

        setStats({
          totalCourses: coursesSnap.size,
          totalStudents,
          completionRate: totalStudents > 0 ? Math.round((totalCompleted / totalStudents) * 100) : 0,
          recentActivities: recentActivities.slice(0, 5),
          coursesOverview: coursesWithStudentCounts,
        })
      } catch (error) {
        console.error("Error fetching teacher stats:", error)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchStats()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Instructor Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses</CardTitle>
            <BookOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground mt-1">Courses you&apos;ve created</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all your courses</p>
          </CardContent>
        </Card>
        <Card className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <BarChart className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average across all courses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courses Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.coursesOverview && stats.coursesOverview.length > 0 ? (
            <ul className="space-y-2 text-muted-foreground">
              {stats.coursesOverview.map((course: any) => (
                <li key={course.id} className="flex justify-between items-center">
                  <span>{course.title}</span>
                  <span className="font-medium">{course.studentCount} Students</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No courses available or no students enrolled yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-muted-foreground">
            {stats.recentActivities.map((activity: any, index: number) => (
              <li key={index}>
                New student enrolled in &quot;{activity.courseName}&quot;
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
