"use client"

import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PlayCircle, Clock, Award, BookOpen, Video, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function StudentDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const enrollmentsRef = collection(db, "enrollments");
    const q = query(enrollmentsRef, where("userId", "==", user.uid));

    const unsubscribeEnrollments = onSnapshot(q, async (enrollmentsSnapshot) => {
      try {
        const enrollmentDataPromises = enrollmentsSnapshot.docs.map(async (enrollDoc) => {
          const enrollment = { id: enrollDoc.id, ...enrollDoc.data() };
          const courseDocRef = doc(db, "courses", enrollment.courseId);
          const courseSnap = await getDoc(courseDocRef);
          let courseData = null;
          if (courseSnap.exists()) {
            courseData = { id: courseSnap.id, ...courseSnap.data() };
          }

          // Fetch all quizzes for this course
          const quizzesRef = collection(db, "quizzes");
          const quizzesQ = query(quizzesRef, where("courseId", "==", enrollment.courseId));
          const quizzesSnap = await getDocs(quizzesQ);
          const allQuizzes = quizzesSnap.docs.map(qDoc => ({ id: qDoc.id, ...qDoc.data() }));

          // Fetch completed quizzes for this user and course
          const completedQuizzesRef = collection(db, "users", user.uid, "completedQuizzes");
          const completedQuizzesQ = query(completedQuizzesRef, where("courseId", "==", enrollment.courseId));
          const completedQuizzesSnap = await getDocs(completedQuizzesQ);
          const completedQuizIds = new Set(completedQuizzesSnap.docs.map(qDoc => qDoc.id));

          return { ...enrollment, course: courseData };
        });

        const allEnrollments = await Promise.all(enrollmentDataPromises);

        const certificatesRef = collection(db, "certificates");
        const cq = query(certificatesRef, where("userId", "==", user.uid));
        const certificatesSnap = await getDocs(cq); // Still using getDocs for certificates for now

        const completedEnrollments = allEnrollments.filter((e) => e.status === "completed").length;
        const totalProgress =
          allEnrollments.length > 0
            ? Math.round(allEnrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / allEnrollments.length)
            : 0;

        setStats({
          enrolledCount: allEnrollments.length,
          completedCount: completedEnrollments,
          certificateCount: certificatesSnap.size,
          totalProgress: totalProgress,
          recentEnrollments: allEnrollments.slice(0, 3), // Take first 3 for "Continue Learning"
        });
      } catch (err: any) {
        console.error("[v0] Error fetching real-time stats:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error("[v0] Real-time enrollments error:", err);
      setError("Failed to listen for enrollment updates.");
      setLoading(false);
    });

    return () => unsubscribeEnrollments();
  }, [user]);

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName?.split(" ")[0] || "Explorer"}</h1>
        <p className="text-muted-foreground mt-2">Pick up where you left off and keep mastering your craft.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enrolledCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Learning Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProgress}%</div>
            <Progress value={stats.totalProgress} className="h-2 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.certificateCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Continue Learning</h2>
          {stats.recentEnrollments.length > 0 ? (
            stats.recentEnrollments.map((enrollment: any) => (
              <Card key={enrollment.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-16 w-24 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
                    {enrollment.course?.thumbnail ? (
                      <img src={enrollment.course.thumbnail} alt={enrollment.course.title} className="w-full h-full object-cover" />
                    ) : (
                      <PlayCircle className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{enrollment.course?.title || "Loading Course..."}</h4>
                    <Progress value={enrollment.progress || 0} className="h-1.5 mt-2" />
                  </div>
                  <Button asChild>
                    <Link href={`/courses/${enrollment.courseId}`}>Continue</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">You haven't enrolled in any courses yet.</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Explore our wide range of courses and start your learning journey today!
              </p>
              <Button asChild className="mt-4">
                <Link href="/courses">Explore Courses</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
