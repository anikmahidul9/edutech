"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from "firebase/firestore"
import { RoleGuard } from "@/components/role-guard"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertTriangle, PlusCircle, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useForm } from "react-hook-form"
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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_PDF_TYPES = ["application/pdf"];

const courseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  departmentId: z.string().min(1, "Please select a department"),
  semester: z.string().min(3, "Semester must be at least 3 characters"),
  youtubePlaylistLink: z.string().url("Please enter a valid YouTube playlist URL"),
  thumbnail: z.any()
    .refine((files) => typeof files === 'string' || files?.length > 0, "Course thumbnail is required.")
    .refine((files) => typeof files === 'string' || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 5MB.`)
    .refine(
      (files) => typeof files === 'string' || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ).optional(), // Made optional for editing
  resources: z.any()
    .refine((files) => typeof files === 'string' || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => typeof files === 'string' || files?.length === 0 || ACCEPTED_PDF_TYPES.includes(files?.[0]?.type),
      "Only .pdf format is supported for resources."
    ).optional(), // Made optional for editing
})

interface Department {
  id: string;
  name: string;
}

export default function EditCoursePage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: "",
      semester: "",
      youtubePlaylistLink: "",
      thumbnail: "",
      resources: "",
    },
  })

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments")
        if (!response.ok) {
          throw new Error("Failed to fetch departments")
        }
        const data = await response.json()
        setDepartments(data)
      } catch (error: any) {
        toast.error(error.message || "Error fetching departments.")
        console.error("Error fetching departments:", error)
      } finally {
        setLoadingDepartments(false)
      }
    }
    fetchDepartments()
  }, [])

  useEffect(() => {
    if (!user || !courseId) return

    const fetchCourse = async () => {
      try {
        const courseDocRef = doc(db, "courses", courseId)
        const courseSnap = await getDoc(courseDocRef)

        if (courseSnap.exists()) {
          const courseData = courseSnap.data()
          // Security check: ensure the logged-in user is the instructor
          if (courseData.teacherId === user.uid) { // Changed from instructorId to teacherId
            form.reset({
              title: courseData.title,
              description: courseData.description,
              departmentId: courseData.departmentId || "",
              semester: courseData.semester || "",
              youtubePlaylistLink: courseData.youtubePlaylistLink || "",
              thumbnail: courseData.thumbnail || "", // Pre-fill with existing URL
              resources: courseData.resources?.[0] || "", // Pre-fill with existing URL
            })
            setIsAuthorized(true)
          } else {
            setError("You are not authorized to edit this course.")
          }
        } else {
          setError("Course not found.")
        }
      } catch (err) {
        console.error("Error fetching course:", err)
        setError("Failed to load course data.")
      } finally {
        setLoading(false)
      }
    }

    fetchCourse()
  }, [user, courseId, form]) // Added form to dependency array

  useEffect(() => {
    if (!courseId) return;

    const fetchQuizzes = async () => {
      console.log("Fetching quizzes for courseId:", courseId); // Added log
      try {
        const quizzesRef = collection(db, "quizzes");
        const q = query(quizzesRef, where("courseId", "==", courseId));
        const querySnapshot = await getDocs(q);
        const fetchedQuizzes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuizzes(fetchedQuizzes);
        console.log("Fetched quizzes:", fetchedQuizzes); // Added log
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error("Failed to load quizzes.");
      }
    };

    fetchQuizzes();
  }, [courseId, router]);

  const handleDeleteQuiz = async () => {
    if (!quizToDelete) return;

    try {
      await deleteDoc(doc(db, "quizzes", quizToDelete));
      toast.success("Quiz deleted successfully!");
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizToDelete)); // Optimistic update
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz.");
    } finally {
      setQuizToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  async function uploadFile(file: File, resourceType: "image" | "raw"): Promise<string> {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ file: reader.result, resourceType }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "File upload failed.");
          }

          const { secure_url } = await response.json();
          resolve(secure_url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    if (!user || !isAuthorized) {
      toast.error("You are not authorized to perform this action.")
      return
    }

    setIsSubmitting(true)

    try {
      let thumbnailUrl = values.thumbnail as string
      if (values.thumbnail && typeof values.thumbnail !== 'string' && values.thumbnail.length > 0) {
        thumbnailUrl = await uploadFile(values.thumbnail[0], "image");
      }

      let resourceUrl = values.resources as string
      if (values.resources && typeof values.resources !== 'string' && values.resources.length > 0) {
        resourceUrl = await uploadFile(values.resources[0], "raw");
      }

      const courseDocRef = doc(db, "courses", courseId)
      await updateDoc(courseDocRef, {
        title: values.title,
        description: values.description,
        departmentId: values.departmentId,
        semester: values.semester,
        youtubePlaylistLink: values.youtubePlaylistLink,
        thumbnail: thumbnailUrl,
        resources: resourceUrl ? [resourceUrl] : [],
        updatedAt: serverTimestamp(),
      })

      toast.success("Course updated successfully!")
      router.push("/dashboard/teacher/courses")
    } catch (error: any) {
      console.error("Error updating course: ", error)
      toast.error(error.message || "Failed to update course. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={["teacher"]}>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Edit Course</CardTitle>
            <CardDescription>Update the details of your course.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || loadingDepartments ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-40 text-red-500">
                <AlertTriangle className="h-12 w-12 mb-4" />
                <p>{error}</p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Title</FormLabel>
                        <FormControl><Input placeholder="e.g. Advanced React Development" {...field} /></FormControl>
                        <FormDescription>
                          What will you teach in this course?
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
                        <FormLabel>Course Description</FormLabel>
                                                <FormControl><Textarea
                            placeholder="Describe your course content"
                            className="resize-y"
                            {...field}
                          /></FormControl>
                        <FormDescription>
                          Provide a detailed description of your course.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger>
                            <SelectValue placeholder="Select a department" />
                          </SelectTrigger></FormControl>
                          <SelectContent>
                            {departments.map((department) => (
                              <SelectItem key={department.id} value={department.id}>
                                {department.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign this course to a specific department.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Semester</FormLabel>
                        <FormControl><Input placeholder="e.g. Fall 2024" {...field} /></FormControl>
                        <FormDescription>
                          Which semester is this course offered?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="youtubePlaylistLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>YouTube Playlist Link</FormLabel>
                        <FormControl><Input placeholder="e.g. https://www.youtube.com/playlist?list=..." {...field} /></FormControl>
                        <FormDescription>
                          Link to the YouTube playlist for this course.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Course Thumbnail</FormLabel>
                        <FormControl><Input
                            {...fieldProps}
                            type="file"
                            accept={ACCEPTED_IMAGE_TYPES.join(",")}
                            onChange={(event) => {
                              onChange(event.target.files && event.target.files.length > 0 ? event.target.files : value);
                            }}
                          /></FormControl>
                        {typeof value === 'string' && value && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Current Thumbnail:</p>
                            <img src={value} alt="Current Thumbnail" className="w-32 h-auto rounded-md" />
                          </div>
                        )}
                        <FormDescription>
                          Upload a compelling image for your course thumbnail. (Max 5MB, JPG, PNG, WEBP)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resources"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Course Resources (PDF)</FormLabel>
                        <FormControl><Input
                            {...fieldProps}
                            type="file"
                            accept={ACCEPTED_PDF_TYPES.join(",")}
                            onChange={(event) => {
                              onChange(event.target.files && event.target.files.length > 0 ? event.target.files : value);
                            }}
                          /></FormControl>
                        {typeof value === 'string' && value && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Current Resource:</p>
                            <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                              View Current Resource
                            </a>
                          </div>
                        )}
                        <FormDescription>
                          Upload supplementary PDF resources for your course. (Max 5MB, PDF)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Course"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Quiz Management Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quiz Management</CardTitle>
            <CardDescription>Create and manage quizzes for this course.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="mb-4">
              <Link href={`/dashboard/teacher/courses/edit/${courseId}/quizzes/new`}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Quiz
              </Link>
            </Button>
            {quizzes.length === 0 ? (
              <p className="text-muted-foreground">No quizzes created yet for this course.</p>
            ) : (
              <ul className="space-y-2">
                {quizzes.map((quiz) => (
                  <li key={quiz.id} className="flex justify-between items-center p-3 border rounded-md">
                    <span>{quiz.title}</span>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setQuizToDelete(quiz.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your quiz
                and remove its data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteQuiz}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  )
}