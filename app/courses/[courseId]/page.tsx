"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  setDoc,
  increment,
  orderBy
} from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, AlertTriangle, Star, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// --- Interfaces ---
interface Course {
  id: string
  title: string
  description: string
  category: string
  level: string
  teacherId: string
  youtubePlaylistLink: string
  thumbnail?: string
  resources?: string[]
  departmentId?: string; // Added departmentId
  status: "pending" | "published" | "rejected"; // Added status field
}

interface Teacher {
  displayName: string
  photoURL: string
  bio: string
}

interface Video {
  id: string
  title: string
  thumbnail: string
}

interface Review {
  id: string
  userId: string
  rating: number
  comment: string
  createdAt: Date
  userProfile: {
    displayName: string
    photoURL?: string
  }
}

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(500),
})

// --- Reusable Components ---

function StarRating({ rating, setRating, disabled = false }: { rating: number; setRating?: (rating: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-6 w-6 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${!disabled ? 'cursor-pointer' : ''}`}
          onClick={() => !disabled && setRating?.(star)}
        />
      ))}
    </div>
  )
}

function ReviewForm({ courseId, onReviewAdded }: { courseId: string; onReviewAdded: () => void }) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, comment: "" },
  })

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    if (!user) {
      toast.error("You must be logged in to submit a review.")
      return
    }
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, "reviews"), {
        courseId,
        userId: user.uid,
        rating: values.rating,
        comment: values.comment,
        createdAt: serverTimestamp(),
      })
      toast.success("Review submitted successfully!")
      form.reset()
      onReviewAdded()
    } catch (error) {
      console.error("Error submitting review:", error)
      toast.error("Failed to submit review.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="mt-8">
      <CardHeader><CardTitle>Write a Review</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="rating" render={({ field }) => (
              <FormItem>
                <FormLabel>Your Rating</FormLabel>
                <FormControl><StarRating rating={field.value} setRating={(r) => field.onChange(r)} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="comment" render={({ field }) => (
              <FormItem>
                <FormLabel>Your Comment</FormLabel>
                <FormControl><Textarea placeholder="Share your thoughts..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function ReviewsList({ reviews }: { reviews: Review[] }) {
  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + (r.rating ?? 0), 0) / reviews.length : 0

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Student Reviews</CardTitle>
        <div className="flex items-center gap-2">
          <StarRating rating={averageRating} disabled />
          <span className="text-muted-foreground">({averageRating.toFixed(1)} out of 5)</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="flex gap-4 items-start border-b pb-4 last:border-b-0">
              <Avatar>
                <AvatarImage src={review.userProfile?.photoURL || "/placeholder-user.jpg"} />
                <AvatarFallback>{review.userProfile?.displayName?.charAt(0) || "A"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{review.userProfile?.displayName}</p>
                <StarRating rating={review.rating ?? 0} disabled />
                <p className="mt-1 text-muted-foreground">{review.comment}</p>
                <p className="text-xs text-muted-foreground">{review.createdAt.toLocaleDateString()}</p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

// --- Main Page Component ---
export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const { user, profile } = useAuth()
  const router = useRouter()

  // State Management
  const [course, setCourse] = useState<Course | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [departmentName, setDepartmentName] = useState("N/A") // New state for department name
  const [videos, setVideos] = useState<Video[]>([])
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [courseProgress, setCourseProgress] = useState(0);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [unlockedVideos, setUnlockedVideos] = useState<Set<string>>(new Set()); // New state for unlocked videos
  const [loading, setLoading] = useState({ course: true, videos: true, quizzes: true, reviews: true })
  const [error, setError] = useState("")

  const updateLoadingState = (key: keyof typeof loading, value: boolean) => {
    setLoading(prev => ({ ...prev, [key]: value }))
  }

  // --- Data Fetching ---

  const fetchReviews = useCallback(async () => {
    if (!courseId) return
    updateLoadingState('reviews', true)
    try {
      const reviewsQuery = query(collection(db, "reviews"), where("courseId", "==", courseId), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(reviewsQuery)
      const reviewsData: Review[] = await Promise.all(
        snapshot.docs.map(async (reviewDoc) => {
          const reviewData = reviewDoc.data()
          const userProfileSnap = await getDoc(doc(db, "users", reviewData.userId))
          const userProfile = userProfileSnap.exists() ? (userProfileSnap.data() as { displayName: string; photoURL?: string }) : { displayName: "Anonymous" }
          return {
            id: reviewDoc.id,
            userId: reviewData.userId,
            rating: reviewData.rating ?? 0,
            comment: reviewData.comment ?? "",
            createdAt: reviewData.createdAt?.toDate?.() ?? new Date(),
            userProfile,
          } as Review
        })
      )
      setReviews(reviewsData)
    } catch (err) {
      console.error("Error fetching reviews:", err)
    } finally {
      updateLoadingState('reviews', false)
    }
  }, [courseId])

  useEffect(() => {
    if (!courseId) return

    const fetchCourseData = async () => {
      updateLoadingState('course', true)
      try {
        const courseDocRef = doc(db, "courses", courseId)
        const courseSnap = await getDoc(courseDocRef)

        if (courseSnap.exists()) {
          const courseData = { id: courseSnap.id, ...courseSnap.data() } as Course

          // Check course status for visibility
          const isTeacherOrAdmin = user && (user.uid === courseData.teacherId || profile?.role === "admin");
          if (courseData.status !== "published" && !isTeacherOrAdmin) {
            setError("This course is not published yet or has been rejected.");
            setLoading(false);
            return;
          }
          setCourse(courseData)

          const teacherDocRef = doc(db, "users", courseData.teacherId)
          const teacherSnap = await getDoc(teacherDocRef)
          if (teacherSnap.exists()) setTeacher(teacherSnap.data() as Teacher)

          // Fetch department name
          if (courseData.departmentId) {
            const departmentDoc = await getDoc(doc(db, "departments", courseData.departmentId))
            if (departmentDoc.exists()) {
              setDepartmentName(departmentDoc.data().name || "N/A")
            }
          }

          if (user) {
            const enrollmentQ = query(collection(db, "enrollments"), where("userId", "==", user.uid), where("courseId", "==", courseId));
            const enrollmentSnap = await getDocs(enrollmentQ);
            if (!enrollmentSnap.empty) {
              setIsEnrolled(true);
              setCourseProgress(enrollmentSnap.docs[0].data().progress || 0);
            } else {
              setIsEnrolled(false);
              setCourseProgress(0);
            }

            // Check if certificate already exists
            const certificateQ = query(collection(db, "certificates"), where("userId", "==", user.uid), where("courseId", "==", courseId));
            const certificateSnap = await getDocs(certificateQ);
            setHasCertificate(!certificateSnap.empty);
          }
        } else {
          setError("Course not found.")
        }
      } catch (err) {
        console.error("Error fetching course:", err)
        setError("Failed to load course details.")
      } finally {
        updateLoadingState('course', false)
      }
    }

    fetchCourseData()
    fetchReviews()
  }, [courseId, user, fetchReviews])

  useEffect(() => {
    if (!courseId) return
    const fetchQuizzes = async () => {
      updateLoadingState('quizzes', true)
      try {
        const q = query(collection(db, "quizzes"), where("courseId", "==", courseId))
        const querySnapshot = await getDocs(q)
        setQuizzes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      } catch (error) {
        console.error("Error fetching quizzes:", error)
      } finally {
        updateLoadingState('quizzes', false)
      }
    }
    fetchQuizzes()
  }, [courseId])

  useEffect(() => {
    if (!user || !courseId) return;

    const fetchUnlockedVideos = async () => {
      try {
        const unlockedVideosRef = collection(db, "users", user.uid, "unlockedVideos");
        const q = query(unlockedVideosRef, where("courseId", "==", courseId));
        const querySnapshot = await getDocs(q);
        const fetchedUnlockedVideoIds = new Set(querySnapshot.docs.map(doc => doc.id));
        setUnlockedVideos(fetchedUnlockedVideoIds);
      } catch (err) {
        console.error("Error fetching unlocked videos:", err);
      }
    };

    fetchUnlockedVideos();
  }, [user, courseId]);

  useEffect(() => {
    if (!course) return
    const fetchVideos = async () => {
      updateLoadingState('videos', true)
      try {
        const playlistId = new URL(course.youtubePlaylistLink).searchParams.get("list")
        if (playlistId) {
          const response = await fetch("/api/youtube/playlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playlistId, limit: 50 }),
          })
          if (!response.ok) throw new Error("Failed to fetch playlist")
          const data = await response.json()
          setVideos(data)
          if (data.length > 0) setSelectedVideo(data[0])
        }
      } catch (error) {
        console.error("Error fetching videos:", error)
      } finally {
        updateLoadingState('videos', false)
      }
    }
    fetchVideos()
  }, [course])

  const handleEnroll = async () => {
    if (!user || !course) return toast.error("You must be logged in to enroll.")
    try {
      await addDoc(collection(db, "enrollments"), {
        userId: user.uid,
        courseId: course.id,
        enrolledAt: serverTimestamp(),
        status: "active",
        progress: 0,
      })
      setIsEnrolled(true)
      toast.success(`Successfully enrolled in ${course.title}!`)
    } catch (error) {
      console.error("Error enrolling in course: ", error)
      toast.error("Failed to enroll. Please try again.")
    }
  }

  const handleGenerateCertificate = async () => {
    if (!user || !course || !profile) {
      toast.error("Authentication or course data missing.");
      return;
    }

    if (courseProgress !== 100) {
      toast.error("You must complete 100% of the course to unlock the certificate.");
      return;
    }

    try {
      // Assuming a simple grade calculation for now, e.g., based on overall quiz performance or just pass/fail
      // For a real system, you'd pass actual grade data
      const grade = "A+"; // Placeholder for now

      const certificateResponse = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          courseId: course.id,
          grade: grade,
        }),
      });

      if (!certificateResponse.ok) {
        const errorData = await certificateResponse.json();
        throw new Error(errorData.message || "Failed to generate certificate.");
      }

      toast.success("Certificate unlocked and generated successfully!");
      setHasCertificate(true); // Update state to reflect certificate generation
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      toast.error(error.message || "Failed to generate certificate. Please try again.");
    }
  };

  const handleUnlockVideo = async (video: Video) => {
    if (!user || !profile) {
      toast.error("You must be logged in to unlock videos.")
      return;
    }
    if (!course) {
      toast.error("Course details not loaded.")
      return;
    }

    const coinsToUnlock = 10;
    if ((profile.coins ?? 0) < coinsToUnlock) {
      toast.info("You need at least 10 coins to unlock this video. Take a quiz to earn more coins!");
      return;
    }

    try {
      // Deduct coins
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        coins: increment(-coinsToUnlock),
      });

      // Record unlocked video
      const unlockedVideoDocRef = doc(db, "users", user.uid, "unlockedVideos", video.id);
      await setDoc(unlockedVideoDocRef, {
        courseId: course.id,
        unlockedAt: new Date(),
        videoTitle: video.title,
      });

      // Update local state
      setUnlockedVideos(prev => new Set(prev).add(video.id));
      setSelectedVideo(video); // Play the video immediately
      toast.success(`Video unlocked! ${coinsToUnlock} coins deducted.`);
    } catch (err) {
      console.error("Error unlocking video:", err);
      toast.error("Failed to unlock video. Please try again.");
    }
  };

  // --- Render Logic ---

  if (loading.course) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Course Not Found</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  if (!course) return null

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        <div className="md:col-span-2 space-y-8">
          <div className="relative aspect-video rounded-lg overflow-hidden">
            {selectedVideo ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.id}?modestbranding=1&rel=0&fs=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                {videos.length === 0 && course ? (
                  <p>No videos found in this playlist. Please check the YouTube playlist link.</p>
                ) : (
                  <Image
                    src={course.thumbnail || "/placeholder.svg"}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                {course.title}
                {!user ? (
                  <Button onClick={() => router.push("/login")}>Login to Enroll</Button>
                ) : isEnrolled ? (
                  courseProgress === 100 && !hasCertificate ? (
                    <Button onClick={handleGenerateCertificate}>Unlock Certificate</Button>
                  ) : hasCertificate ? (
                    <Button variant="outline" asChild>
                      <Link href={`/dashboard/certificates?courseId=${courseId}`}>View Certificate</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>Enrolled ({courseProgress}%)</Button>
                  )
                ) : (
                  <Button onClick={handleEnroll}>Add to My Course</Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{course.description}</p>
            </CardContent>
          </Card>

          {course.resources && course.resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Course Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.resources.map((resource, index) => (
                    <li key={index}>
                      <a href={resource} download={`${course.title} - Resource ${index + 1}.pdf`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Resource {index + 1} (PDF)
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {teacher && (
            <Card>
              <CardHeader>
                <CardTitle>About the Instructor</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={teacher.photoURL || "/placeholder-user.jpg"} alt={teacher.displayName} />
                  <AvatarFallback>{teacher.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold text-lg">{teacher.displayName}</h4>
                  <p className="text-muted-foreground">{teacher.bio || "No bio available."}</p>
                  <Button asChild variant="link" className="p-0 h-auto mt-2">
                    <Link href={`/mentors/${course.teacherId}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Reviews */}
      <div className="mt-8">
        {loading.reviews ? <Loader2 className="animate-spin" /> : <ReviewsList reviews={reviews} />}
      </div>

      {isEnrolled && (
        <div className="mt-8">
          <ReviewForm courseId={courseId} onReviewAdded={fetchReviews} />
        </div>
      )}
        </div>

        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Course Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading.videos ? <Loader2 className="animate-spin" /> : videos.length > 0 ? (
                <ul className="space-y-2">
                  {videos.map((video, index) => {
                    const isLocked = index >= 3 && !unlockedVideos.has(video.id);
                    const elements = [];
                    elements.push(
                      <li
                        key={video.id}
                        className={`p-2 rounded-md cursor-pointer ${selectedVideo?.id === video.id ? 'bg-primary/20' : 'hover:bg-gray-100'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!isLocked) {
                            setSelectedVideo(video)
                          } else {
                            const coinsToUnlock = 10;
                            if ((profile?.coins ?? 0) >= coinsToUnlock) {
                              handleUnlockVideo(video);
                            } else {
                              toast.info("You need at least 10 coins to unlock this video. Take a quiz to earn more coins!");
                            }
                          }
                        }}
                      >
                        {video.title}
                        {isLocked && (
                          <span className="ml-2 text-xs text-muted-foreground">(Locked)</span>
                        )}
                      </li>
                    );

                    // Display quizzes after every 3 videos
                    if ((index + 1) % 3 === 0) {
                      const quizNumber = Math.floor(index / 3) + 1;
                      // Check if there are any quizzes for this section
                      const quizzesForThisSection = quizzes.filter(quiz => parseInt(quiz.section) === quizNumber);

                      elements.push(
                        <div key={`quiz-section-${quizNumber}`} className="text-center pt-4 border-t mt-4">
                          {quizzesForThisSection.length > 0 ? (
                            <Button asChild>
                              <Link href={`/courses/${courseId}/section/${quizNumber}`}>
                                Take Quizzes for Section {quizNumber}
                              </Link>
                            </Button>
                          ) : (
                            <p className="text-muted-foreground">No quizzes available for Section {quizNumber}.</p>
                          )}
                        </div>
                      );
                    }
                    return elements;
                  })}
                </ul>
              ) : (
                <p>No videos available for this course.</p>
              )}

              <div className="space-y-2 text-sm text-muted-foreground pt-4 border-t">
                {departmentName !== "N/A" && (
                  <p><strong>Department:</strong> {departmentName}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      
    </div>
  )
}