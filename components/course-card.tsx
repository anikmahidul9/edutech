"use client"

import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore"
import { useEffect, useState } from "react"
import { Star, Users, PlayCircle, BookOpen, Clock, Award, GraduationCap, Eye } from "lucide-react"

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

interface CourseCardProps {
  course: Course
}

export function CourseCard({ course }: CourseCardProps) {
  const [teacherName, setTeacherName] = useState("Loading...")
  const [departmentName, setDepartmentName] = useState("Loading...")
  const [reviews, setReviews] = useState<any[]>([])
  const [rating, setRating] = useState(0)
  const [students, setStudents] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTeacherName() {
      if (course.teacherId) {
        const teacherDoc = await getDoc(doc(db, "users", course.teacherId))
        if (teacherDoc.exists()) {
          setTeacherName(teacherDoc.data().displayName || "Unnamed Teacher")
        } else {
          setTeacherName("Unknown Teacher")
        }
      } else {
        setTeacherName("N/A")
      }
    }
    fetchTeacherName()
  }, [course.teacherId])

  useEffect(() => {
    async function fetchDepartmentName() {
      if (course.departmentId) {
        const departmentDoc = await getDoc(doc(db, "departments", course.departmentId))
        if (departmentDoc.exists()) {
          setDepartmentName(departmentDoc.data().name || "Unknown Department")
        } else {
          setDepartmentName("N/A")
        }
      } else {
        setDepartmentName("N/A")
      }
    }
    fetchDepartmentName()
  }, [course.departmentId])

  useEffect(() => {
    async function fetchReviewsAndEnrollments() {
      try {
        setLoading(true)
        console.log("CourseCard: Fetching reviews for course:", course.id);
        const reviewsQuery = query(collection(db, "reviews"), where("courseId", "==", course.id));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviewsData = reviewsSnapshot.docs.map(doc => doc.data());
        console.log("CourseCard: Fetched reviews:", reviewsData);
        setReviews(reviewsData);

        if (reviewsData.length > 0) {
          const totalRating = reviewsData.reduce((acc, review) => acc + review.rating, 0);
          setRating(totalRating / reviewsData.length);
        }

        const enrollmentsQuery = query(collection(db, "enrollments"), where("courseId", "==", course.id));
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        setStudents(enrollmentsSnapshot.size);
      } catch (error) {
        console.error("Error fetching course data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchReviewsAndEnrollments();
  }, [course.id]);

  const difficultyColors: Record<string, string> = {
    Beginner: "bg-green-100 text-green-800 border-green-300",
    Intermediate: "bg-blue-100 text-blue-800 border-blue-300",
    Advanced: "bg-purple-100 text-purple-800 border-purple-300",
  }

  const difficultyIcon: Record<string, JSX.Element> = {
    Beginner: <GraduationCap className="h-3 w-3 mr-1" />,
    Intermediate: <BookOpen className="h-3 w-3 mr-1" />,
    Advanced: <Award className="h-3 w-3 mr-1" />,
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
          <div className="h-40 rounded-lg bg-amber-200/50 mb-4"></div>
          <div className="h-4 bg-amber-200/50 rounded mb-3"></div>
          <div className="h-3 bg-amber-200/50 rounded mb-2 w-3/4"></div>
          <div className="h-3 bg-amber-200/50 rounded mb-4 w-1/2"></div>
          <div className="h-10 bg-amber-200/50 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/courses/${course.id}`} className="group block">
      <Card className="overflow-hidden border-2 border-amber-200 bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/50 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-yellow-400 hover:-translate-y-1">
        

        {/* Image Container */}
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10"></div>
          <Image
            src={course.thumbnail || "/placeholder.svg"}
            alt={course.title}
            fill
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          
          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-5">
          {/* Title */}
          <h3 className="mb-2 line-clamp-2 text-lg font-bold text-amber-900 group-hover:text-amber-700 transition-colors min-h-[56px]">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{teacherName.charAt(0)}</span>
            </div>
            <p className="text-sm text-amber-600 font-medium">by {teacherName}</p>
          </div>

          {/* Description */}
          <p className="text-sm text-amber-700/80 mb-4 line-clamp-2 min-h-[40px]">
            {course.description}
          </p>

          {/* Department */}
          {departmentName !== "N/A" && (
            <div className="flex items-center gap-2 mb-4">
              <div className="w-4 h-4 rounded bg-gradient-to-r from-yellow-400 to-amber-500"></div>
              <span className="text-xs font-medium text-amber-700">{departmentName}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between mb-4 pt-3 border-t border-amber-200">
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 font-bold text-amber-900">{rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-amber-600">({reviews.length})</span>
            </div>

            {/* Students */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 text-amber-500" />
                <span className="ml-1 font-bold text-amber-900">{students.toLocaleString()}</span>
              </div>
              <span className="text-xs text-amber-600">students</span>
            </div>

            {/* Category */}
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">{course.category}</span>
            </div>
          </div>
        </CardContent>

        {/* Footer with Button */}
        <CardFooter className="p-5 pt-0">
          <Button 
            className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-500 text-white font-bold rounded-xl py-3 shadow-lg shadow-amber-200/50 hover:shadow-amber-300/70 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-amber-300/70"
          >
            <Eye className="mr-2 h-4 w-4" />
            View Course Details
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}