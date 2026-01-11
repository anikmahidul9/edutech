"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusCircle } from "lucide-react"
import Image from "next/image"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const ACCEPTED_PDF_TYPES = ["application/pdf"]

const courseSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  departmentId: z.string().min(1),
  semester: z.string().min(3),
  youtubePlaylistLink: z.string().url(),
  thumbnail: z.any()
    .refine((files) => files?.length > 0, "Course thumbnail is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, "Max 5MB")
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), "Only JPG, PNG, WEBP"),
  resources: z.any()
    .refine((files) => files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, "Max 5MB")
    .refine((files) => files?.length === 0 || ACCEPTED_PDF_TYPES.includes(files?.[0]?.type), "Only PDF")
    .optional(),
})

interface Department {
  id: string
  name: string
}

export default function CreateCoursePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments")
        const data = await response.json()
        setDepartments(data)
      } catch {
        toast.error("Failed to load departments")
      } finally {
        setLoadingDepartments(false)
      }
    }
    fetchDepartments()
  }, [])

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      departmentId: "",
      semester: "",
      youtubePlaylistLink: "",
    },
  })

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setThumbnailPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setThumbnailPreview(null)
    }
  }

  async function uploadFile(file: File, resourceType: "image" | "raw"): Promise<string> {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: reader.result, resourceType }),
          })
          const { secure_url } = await response.json()
          resolve(secure_url)
        } catch (e) {
          reject(e)
        }
      }
      reader.onerror = (err) => reject(err)
    })
  }

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    if (!user) return toast.error("You must be logged in.")
    setIsSubmitting(true)
    try {
      const thumbnailUrl = values.thumbnail?.[0] ? await uploadFile(values.thumbnail[0], "image") : ""
      const resourceUrl = values.resources?.[0] ? await uploadFile(values.resources[0], "raw") : ""
      await addDoc(collection(db, "courses"), {
        ...values,
        thumbnail: thumbnailUrl,
        resources: resourceUrl ? [resourceUrl] : [],
        teacherId: user.uid,
        createdAt: serverTimestamp(),
        status: "pending",
      })
      toast.success("Course created successfully!")
      router.push("/dashboard/teacher/courses")
    } catch (e: any) {
      toast.error(e.message || "Failed to create course")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto rounded-3xl shadow-2xl border border-yellow-200 bg-yellow-50/50 backdrop-blur-sm">
        <CardHeader className="bg-yellow-100/50 rounded-t-3xl px-8 py-6 shadow-inner">
          <CardTitle className="text-4xl font-extrabold text-yellow-900 mb-1">
            Create a New Course
          </CardTitle>
          <p className="text-yellow-800/70">Fill out the form below to add your course</p>
        </CardHeader>
        <CardContent className="px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Title */}
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Introduction to Web Development" className="bg-white/80 shadow-inner rounded-xl border border-yellow-200 focus:border-yellow-400" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Description */}
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe your course..." rows={4} className="bg-white/80 shadow-inner rounded-xl border border-yellow-200 focus:border-yellow-400 resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Department & Semester */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="departmentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingDepartments}>
                      <FormControl asChild>
                        <SelectTrigger className="bg-white/80 shadow-inner rounded-xl border border-yellow-200 focus:border-yellow-400">
                          <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select department"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="semester" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Fall 2024" className="bg-white/80 shadow-inner rounded-xl border border-yellow-200 focus:border-yellow-400" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* YouTube Link */}
              <FormField control={form.control} name="youtubePlaylistLink" render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube Playlist Link</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://www.youtube.com/playlist?list=..." className="bg-white/80 shadow-inner rounded-xl border border-yellow-200 focus:border-yellow-400" />
                  </FormControl>
                  <FormDescription>This link will be private until course is approved</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Thumbnail */}
              <FormField control={form.control} name="thumbnail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Thumbnail</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" {...form.register("thumbnail")} onChange={(e) => {field.onChange(e); handleThumbnailChange(e)}} className="bg-white/80 shadow-inner rounded-xl border border-yellow-200 focus:border-yellow-400" />
                  </FormControl>
                  {thumbnailPreview && (
                    <div className="mt-2 w-48 h-32 relative rounded-xl overflow-hidden shadow-lg">
                      <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <FormDescription>Upload a thumbnail (Max 5MB, JPG, PNG, WEBP)</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Resources */}
              <FormField control={form.control} name="resources" render={({ field }) => (
                <FormItem>
                  <FormLabel>Resources (PDF)</FormLabel>
                  <FormControl>
                    <Input type="file" accept="application/pdf" {...form.register("resources")} className="bg-white/80 shadow-inner rounded-xl border border-yellow-200 focus:border-yellow-400" />
                  </FormControl>
                  <FormDescription>Optional PDF file (Max 5MB)</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Submit */}
              <Button type="submit" disabled={isSubmitting} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl flex justify-center items-center gap-2 py-3 text-lg shadow-lg">
                <PlusCircle className={`h-5 w-5 ${isSubmitting ? "animate-spin" : ""}`} />
                {isSubmitting ? "Creating..." : "Create Course"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
