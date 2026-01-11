"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, BookOpen, Quote, Users, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from "firebase/firestore"
import { User, Review } from "@/lib/types"

interface CourseInfo {
  id: string;
  title: string;
  teacherId: string;
}

interface PopulatedReview extends Review {
  user: User | null;
  course: CourseInfo | null;
  instructor: User | null;
}

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<PopulatedReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const reviewsRef = collection(db, "reviews")
    const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(3))

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const reviews: PopulatedReview[] = []
      for (const reviewDoc of querySnapshot.docs) {
        const reviewData = { id: reviewDoc.id, ...reviewDoc.data() } as Review

        let user: User | null = null
        if (reviewData.userId) {
          const userDocRef = doc(db, "users", reviewData.userId)
          const userDoc = await getDoc(userDocRef)
          if (userDoc.exists()) {
            user = { id: userDoc.id, ...userDoc.data() } as User
          }
        }

        let course: CourseInfo | null = null
        let instructor: User | null = null
        if (reviewData.courseId) {
          const courseDocRef = doc(db, "courses", reviewData.courseId)
          const courseDoc = await getDoc(courseDocRef)
          if (courseDoc.exists()) {
            const courseData = { id: courseDoc.id, ...courseDoc.data() } as CourseInfo
            course = courseData

            if (courseData.teacherId) {
              const teacherDocRef = doc(db, "users", courseData.teacherId)
              const teacherDoc = await getDoc(teacherDocRef)
              if (teacherDoc.exists()) {
                instructor = { id: teacherDoc.id, ...teacherDoc.data() } as User
              }
            }
          }
        }

        reviews.push({ ...reviewData, user, course, instructor })
      }
      setTestimonials(reviews)
      setLoading(false)
    }, (error) => {
      console.error("Error fetching testimonials:", error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-amber-50/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-amber-200 mb-6">
              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-amber-700">Student Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
                Real Stories
              </span>
              <span className="block text-amber-900">Real Success</span>
            </h2>
            <p className="text-lg text-amber-700/80">
              Loading inspiring stories...
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(3).fill(0).map((_, index) => (
              <div key={index} className="animate-pulse">
                <Card className="border-2 border-amber-200 bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/30 shadow-lg">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="h-16 w-16 rounded-full bg-amber-200/50"></div>
                      <div className="ml-4">
                        <div className="h-5 w-40 bg-amber-200/50 rounded mb-2"></div>
                        <div className="h-4 w-32 bg-amber-200/50 rounded"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-amber-200/50 rounded"></div>
                      <div className="h-4 bg-amber-200/50 rounded"></div>
                      <div className="h-4 w-2/3 bg-amber-200/50 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (testimonials.length === 0) {
    return (
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-amber-50/30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-dashed border-amber-200 mb-8 mx-auto">
              <Users className="h-12 w-12 text-amber-400" />
            </div>
            <h2 className="text-3xl font-bold text-amber-900 mb-4">Share Your Experience</h2>
            <p className="text-lg text-amber-700/80 mb-8">
              Be the first to share your success story!
            </p>
            <a href="/courses">
              <button className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold rounded-xl px-8 py-4">
                Explore Courses
              </button>
            </a>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-amber-50/30"></div>
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-yellow-300/10 to-amber-300/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-amber-300/10 to-yellow-300/5 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-amber-200 mb-6">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-amber-700">Student Success Stories</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
              Transformative
            </span>
            <span className="block text-amber-900">Learning Experiences</span>
          </h2>
          
          <p className="text-lg text-amber-700/80">
            Join thousands of learners who have transformed their careers with NexusAcademy. 
            Here's what a few of them have to share about their journey.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <div 
              key={item.id} 
              className="transform transition-all duration-500 hover:-translate-y-2"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <Card className="border-2 border-amber-200 bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/30 shadow-lg hover:shadow-2xl hover:border-yellow-400 transition-all duration-300 h-full">
                <CardContent className="p-8 flex flex-col h-full">
                  {/* Quote Icon */}
                  <div className="absolute top-6 right-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400/10 to-amber-500/10 flex items-center justify-center">
                      <Quote className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center mb-6">
                    <Avatar className="h-16 w-16 border-2 border-amber-300">
                      <AvatarImage src={item.user?.photoURL} alt={item.user?.displayName} />
                      <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-xl font-bold">
                        {item.user?.displayName?.charAt(0) || "S"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <h4 className="font-bold text-lg text-amber-900">{item.user?.displayName || "Anonymous Student"}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.user?.role === 'teacher' 
                            ? 'bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-amber-700 border border-amber-300' 
                            : 'bg-gradient-to-r from-blue-400/20 to-blue-500/20 text-blue-700 border border-blue-300'
                        }`}>
                          {item.user?.role === 'teacher' ? 'Instructor' : 'Student'}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array(item.rating)
                            .fill(0)
                            .map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="mb-8 flex-1">
                    <p className="text-amber-700/90 leading-relaxed italic text-lg">
                      &quot;{item.comment}&quot;
                    </p>
                  </div>

                  {/* Course Info */}
                  {item.course && (
                    <div className="mt-auto pt-6 border-t border-amber-200/50">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-400/10 to-amber-500/10 flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-1">
                            {item.course.title}
                          </p>
                          {item.instructor && (
                            <p className="text-xs text-amber-600">
                              Instructor: {item.instructor.displayName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}