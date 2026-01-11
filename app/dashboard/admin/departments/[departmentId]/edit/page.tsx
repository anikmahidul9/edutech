"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft, Save, PlusCircle } from "lucide-react"
import { toast } from "sonner"
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
import Image from "next/image"

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

interface Department {
  id: string;
  name: string;
  headOfDepartment?: string;
  contactEmail?: string;
  description?: string;
  establishedYear?: number;
  imageUrl?: string;
}

const departmentSchema = z.object({
  name: z.string().min(2, "Department name must be at least 2 characters."),
  headOfDepartment: z.string().optional(),
  contactEmail: z.string().email("Invalid email address.").optional().or(z.literal("")),
  description: z.string().optional(),
  establishedYear: z.number().int().min(1900, "Year must be after 1900.").max(new Date().getFullYear(), "Year cannot be in the future.").optional().or(z.literal(0)),
  image: z.any()
    .refine((files) => files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 2MB.`)
    .refine(
      (files) => files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ).optional(),
});

export default function DepartmentEditPage() {
  const params = useParams()
  const departmentId = params.departmentId as string
  const router = useRouter()

  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      headOfDepartment: "",
      contactEmail: "",
      description: "",
      establishedYear: undefined,
      image: undefined,
    },
  });

  useEffect(() => {
    if (!departmentId) return

    const fetchDepartment = async () => {
      try {
        const departmentDocRef = doc(db, "departments", departmentId)
        const departmentSnap = await getDoc(departmentDocRef)

        if (departmentSnap.exists()) {
          const data = departmentSnap.data() as Department
          setDepartment({ id: departmentSnap.id, ...data })
          form.reset({
            name: data.name,
            headOfDepartment: data.headOfDepartment || "",
            contactEmail: data.contactEmail || "",
            description: data.description || "",
            establishedYear: data.establishedYear || undefined,
            image: undefined, // Image field is not pre-filled for security/UX
          })
        } else {
          setError("Department not found.")
        }
      } catch (err) {
        console.error("Error fetching department:", err)
        setError("Failed to load department details.")
      } finally {
        setLoading(false)
      }
    }

    fetchDepartment()
  }, [departmentId, form])

  async function uploadFile(file: File, resourceType: "image"): Promise<string> {
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

  const handleUpdateDepartment = async (values: z.infer<typeof departmentSchema>) => {
    setIsSubmitting(true)
    try {
      let imageUrl = department?.imageUrl || ""
      if (values.image && values.image.length > 0) {
        imageUrl = await uploadFile(values.image[0], "image");
      }

      const requestBody = { ...values, imageUrl };
      console.log("Sending update request with body:", requestBody);

      const response = await fetch(`/api/departments/${departmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error Response:", errorData);
        throw new Error(errorData.message || "Failed to update department.")
      }

      toast.success("Department updated successfully!")
      router.push(`/dashboard/admin/departments/${departmentId}/view`)
    } catch (error: any) {
      toast.error(error.message || "Error updating department.")
      console.error("Error updating department:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center">
        <ArrowLeft className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    )
  }

  if (!department) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="outline" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Department View
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Edit {department.name}</CardTitle>
          <p className="text-muted-foreground">Update the details for this department.</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateDepartment)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Computer Science" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="headOfDepartment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of Department</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Dr. Jane Doe" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="dept.email@example.com" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="establishedYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Established Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 1990"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description of the department..." {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                {department.imageUrl && (
                  <div className="relative h-24 w-24 rounded-md overflow-hidden">
                    <Image src={department.imageUrl} alt="Current Department Image" fill className="object-cover" />
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Department Image</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" {...form.register("image")} disabled={isSubmitting} />
                      </FormControl>
                      <FormDescription>
                        Upload a new image for the department (Max 2MB, JPG, PNG, WEBP).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
