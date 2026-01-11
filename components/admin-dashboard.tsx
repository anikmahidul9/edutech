"use client"

import { db } from "@/lib/firebase/config"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, DollarSign, TrendingUp, Loader2, Star } from "lucide-react"

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersSnap = await getDocs(collection(db, "users"))
        const coursesSnap = await getDocs(collection(db, "courses"))
        const courseMap = new Map(coursesSnap.docs.map(doc => [doc.id, doc.data().title]));
        const enrollmentsSnap = await getDocs(collection(db, "enrollments"))
        const reviewsSnap = await getDocs(collection(db, "reviews"))

        // Fetch recent activities
        const recentActivities: { type: string; description: string; timestamp: Date }[] = []

        // New Users
        const newUsersSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
        newUsersSnap.docs.slice(0, 5).forEach(doc => {
          const userData = doc.data();
          recentActivities.push({
            type: "New User",
            description: `${userData.displayName || userData.email} registered.`,
            timestamp: userData.createdAt && typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate() : new Date(),
          });
        });

        // New Courses
        const newCoursesSnap = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));
        newCoursesSnap.docs.slice(0, 5).forEach(doc => {
          const courseData = doc.data();
          recentActivities.push({
            type: "New Course",
            description: `Course "${courseData.title}" published.`,
            timestamp: courseData.createdAt?.toDate() || new Date(),
          });
        });

        // New Enrollments
        const newEnrollmentsSnap = await getDocs(query(collection(db, "enrollments"), orderBy("enrolledAt", "desc")));
        newEnrollmentsSnap.docs.slice(0, 5).forEach(doc => {
          const enrollmentData = doc.data();
          const courseTitle = courseMap.get(enrollmentData.courseId) || "Unknown Course";
          recentActivities.push({
            type: "New Enrollment",
            description: `A student enrolled in "${courseTitle}".`,
            timestamp: enrollmentData.enrolledAt && typeof enrollmentData.enrolledAt.toDate === 'function' ? enrollmentData.enrolledAt.toDate() : new Date(),
          });
        });

        // New Reviews
        const newReviewsSnap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "desc")));
        newReviewsSnap.docs.slice(0, 5).forEach(doc => {
          const reviewData = doc.data();
          const courseTitle = courseMap.get(reviewData.courseId) || "Unknown Course";
          recentActivities.push({
            type: "New Review",
            description: `New review for "${courseTitle}" (${reviewData.rating} stars).`,
            timestamp: reviewData.createdAt && typeof reviewData.createdAt.toDate === 'function' ? reviewData.createdAt.toDate() : new Date(),
          });
        });

        // Sort all activities by timestamp
        recentActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());


        setStats({
          totalUsers: usersSnap.size,
          totalCourses: coursesSnap.size,
          enrollmentCount: enrollmentsSnap.size,
          recentActivities: recentActivities.slice(0, 10), // Limit to top 10 recent activities
        })
      } catch (error) {
        console.error("Error fetching admin stats:", error)
        setError("Failed to load dashboard data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

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
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrollmentCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivities && stats.recentActivities.length > 0 ? (
            <ul className="space-y-4">
              {stats.recentActivities.map((activity: any, index: number) => (
                <li key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {activity.type === "New User" && <Users className="h-5 w-5 text-blue-500" />}
                    {activity.type === "New Course" && <BookOpen className="h-5 w-5 text-green-500" />}
                    {activity.type === "New Enrollment" && <TrendingUp className="h-5 w-5 text-purple-500" />}
                    {activity.type === "New Review" && <Star className="h-5 w-5 text-yellow-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp.toLocaleString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activities to display.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
