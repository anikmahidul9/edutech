"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, PlusCircle, XCircle } from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const quizSchema = z.object({
  title: z.string().min(5, "Quiz title must be at least 5 characters"),
  description: z.string().optional(),
  section: z.string().regex(/^\d+$/, "Section must be a number").min(1, "Section is required"),
  questions: z.array(
    z.object({
      questionText: z.string().min(1, "Question text is required"),
      options: z.array(z.string().min(1, "Option cannot be empty")).min(2, "At least two options are required"),
      correctAnswer: z.string().min(1, "Correct answer is required"),
    })
  ).min(1, "At least one question is required"),
})

export default function EditQuizPage() { // Changed component name
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string
  const quizId = params.quizId as string // New: Get quizId from params

  const [loadingCourse, setLoadingCourse] = useState(true)
  const [loadingQuiz, setLoadingQuiz] = useState(true) // New: Loading state for quiz
  const [courseTitle, setCourseTitle] = useState("")
  const [youtubePlaylistLink, setYoutubePlaylistLink] = useState<string | null>(null)
  const [maxQuizSections, setMaxQuizSections] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof quizSchema>>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      description: "",
      section: "",
      questions: [{ questionText: "", options: ["", ""], correctAnswer: "" }],
    },
  })

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "questions",
  })

  useEffect(() => {
    if (!courseId) return

    const fetchCourseDetails = async () => {
      try {
        const courseDocRef = doc(db, "courses", courseId)
        const courseSnap = await getDoc(courseDocRef)
        if (courseSnap.exists()) {
          const courseData = courseSnap.data()
              setCourseTitle(courseData.title)
              setYoutubePlaylistLink(courseData.youtubePlaylistLink || null)
        } else {
          toast.error("Course not found.")
          router.push("/dashboard/teacher/courses")
        }
      } catch (error) {
        console.error("Error fetching course details:", error)
        toast.error("Failed to load course details.")
      } finally {
        setLoadingCourse(false)
      }
    }

    fetchCourseDetails()
  }, [courseId, router])

  useEffect(() => {
    if (!youtubePlaylistLink) return;

    const fetchVideoCount = async () => {
      try {
        const playlistIdMatch = youtubePlaylistLink.match(/[?&]list=([^&]+)/);
        const playlistId = playlistIdMatch ? playlistIdMatch[1] : null;

        if (!playlistId) {
          console.warn("No YouTube playlist ID found in link:", youtubePlaylistLink);
          setMaxQuizSections(0);
          return;
        }

        // Fetch all video titles to count them
        const response = await fetch(`/api/youtube/playlist?playlistId=${playlistId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch video titles.");
        }
        const data = await response.json();
        const totalVideos = data.videoTitles ? data.videoTitles.length : 0;
        setMaxQuizSections(Math.ceil(totalVideos / 3)); // 1 quiz after every 3 videos
      } catch (error) {
        console.error("Error fetching video count:", error);
        toast.error("Failed to determine quiz sections.");
      }
    };

    fetchVideoCount();
  }, [youtubePlaylistLink]);

  // New: Fetch quiz data for editing
  useEffect(() => {
    if (!quizId || !courseId) return;

    const fetchQuizData = async () => {
      try {
        const quizDocRef = doc(db, "quizzes", quizId);
        const quizSnap = await getDoc(quizDocRef);

        if (quizSnap.exists()) {
          const quizData = quizSnap.data();
          // Pre-populate form with fetched data
          form.reset({
            title: quizData.title,
            description: quizData.description || "",
            section: quizData.section,
            questions: quizData.questions,
          });
        } else {
          toast.error("Quiz not found.");
          router.push(`/dashboard/teacher/courses/edit/${courseId}`);
        }
      } catch (error) {
        console.error("Error fetching quiz data:", error);
        toast.error("Failed to load quiz data.");
      } finally {
        setLoadingQuiz(false);
      }
    };

    fetchQuizData();
  }, [quizId, courseId, form, router]);


  async function onSubmit(values: z.infer<typeof quizSchema>) {
    if (!user) {
      toast.error("You must be logged in to edit a quiz.")
      return
    }

    setIsSubmitting(true)

    try {
      const quizDocRef = doc(db, "quizzes", quizId); // New: Reference to existing quiz
      await updateDoc(quizDocRef, { // Changed from addDoc to updateDoc
        title: values.title,
        description: values.description,
        section: values.section,
        questions: values.questions,
        updatedAt: serverTimestamp(),
      })

      toast.success("Quiz updated successfully!")
      router.refresh() // Force a refresh of the parent page
      router.push(`/dashboard/teacher/courses/edit/${courseId}`)
    } catch (error: any) {
      console.error("Error updating quiz: ", error); // Changed log message
      toast.error(error.message || "Failed to update quiz. Please try again."); // Changed toast message
      // Log the full error object for more details
      console.error("Full error object:", JSON.stringify(error, null, 2));
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingCourse || loadingQuiz) { // New: Check loadingQuiz
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-2">Edit Quiz</h1> {/* Changed page title */}
        <p className="text-muted-foreground mb-6">For Course: {courseTitle}</p>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Details</CardTitle>
            <CardDescription>Update the details for your quiz.</CardDescription> {/* Changed description */}
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Advanced React Quiz" {...field} /> {/* Changed placeholder */}
                      </FormControl>
                      <FormDescription>
                        A clear and concise title for your quiz.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description of the quiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quiz Section</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a quiz section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {maxQuizSections === 0 ? (
                            <SelectItem value="no-sections" disabled>No sections available (add videos to course)</SelectItem>
                          ) : (
                            Array.from({ length: maxQuizSections }, (_, i) => i + 1).map((sectionNum) => (
                              <SelectItem key={sectionNum} value={String(sectionNum)}>
                                Quiz {sectionNum}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Assign this quiz to a sequential section in the course.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Questions</h3>
                  {fields.map((item, index) => (
                    <Card key={item.id} className="mb-6 p-4">
                      <div className="flex justify-between items-center mb-4">
                        <CardTitle className="text-base">Question {index + 1}</CardTitle>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <XCircle className="h-4 w-4 mr-2" /> Remove Question
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name={`questions.${index}.questionText`}
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel>Question Text</FormLabel>
                            <FormControl>
                              <Input placeholder="What is React?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2 mb-4">
                        <FormLabel>Options</FormLabel>
                        {item.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`questions.${index}.options.${optionIndex}`}
                              render={({ field }) => (
                                <FormItem className="flex-grow">
                                  <FormControl>
                                    <Input placeholder={`Option ${optionIndex + 1}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {item.options.length > 2 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                                                onClick={() => {
                                  const currentQuestion = form.getValues(`questions.${index}`);
                                  const newOptions = currentQuestion.options.filter((_, i) => i !== optionIndex);
                                  const updatedQuestion = { ...currentQuestion, options: newOptions };
                                  update(index, updatedQuestion);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentQuestion = form.getValues(`questions.${index}`);
                            const updatedQuestion = { ...currentQuestion, options: [...currentQuestion.options, ""] };
                            update(index, updatedQuestion);
                          }}
                        >
                          <PlusCircle className="h-4 w-4 mr-2" /> Add Option
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name={`questions.${index}.correctAnswer`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer (Exact Match)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter the exact correct option text" {...field} />
                            </FormControl>
                            <FormDescription>
                              Must exactly match one of the options above.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </Card>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ questionText: "", options: ["", ""], correctAnswer: "" })}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Question
                  </Button>
                </div>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Update Quiz...
                    </>
                  ) : (
                    "Update Quiz"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
