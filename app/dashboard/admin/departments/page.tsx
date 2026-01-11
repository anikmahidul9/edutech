"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import {
  Loader2,
  Trash2,
  PlusCircle,
  Eye,
  Building2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"

const MAX_FILE_SIZE = 2 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

interface Department {
  id: string
  name: string
  headOfDepartment?: string
  contactEmail?: string
  description?: string
  establishedYear?: number
  imageUrl?: string
}

const departmentSchema = z.object({
  name: z.string().min(2),
  headOfDepartment: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  description: z.string().optional(),
  establishedYear: z
    .number()
    .min(1900)
    .max(new Date().getFullYear())
    .optional()
    .or(z.literal(0)),
  image: z
    .any()
    .refine(
      (files) => !files?.[0] || files[0].size <= MAX_FILE_SIZE,
      "Max size 2MB"
    )
    .refine(
      (files) => !files?.[0] || ACCEPTED_IMAGE_TYPES.includes(files[0].type),
      "Invalid image format"
    )
    .optional(),
})

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  const form = useForm<z.infer<typeof departmentSchema>>({
    resolver: zodResolver(departmentSchema),
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments")
      setDepartments(await res.json())
    } catch {
      toast.error("Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File) {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    return new Promise<string>((resolve, reject) => {
      reader.onload = async () => {
        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file: reader.result, resourceType: "image" }),
          })
          const { secure_url } = await res.json()
          resolve(secure_url)
        } catch (e) {
          reject(e)
        }
      }
    })
  }

  const handleAddDepartment = async (values: any) => {
    setIsAdding(true)
    try {
      let imageUrl = ""
      if (values.image?.[0]) {
        imageUrl = await uploadFile(values.image[0])
      }

      await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, imageUrl }),
      })

      toast.success("Department added")
      form.reset()
      fetchDepartments()
    } catch {
      toast.error("Failed to add department")
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm("Delete this department?")) return
    await fetch(`/api/departments/${id}`, { method: "DELETE" })
    toast.success("Department deleted")
    fetchDepartments()
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-200 p-6 shadow">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white">
          <Building2 className="h-7 w-7 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Manage Departments
          </h1>
          <p className="text-sm text-gray-700">
            Create and organize academic departments
          </p>
        </div>
      </div>

      {/* Add Department */}
      <Card className="rounded-2xl shadow">
        <CardHeader>
          <CardTitle>Add New Department</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleAddDepartment)}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >
           {["name", "headOfDepartment", "contactEmail", "establishedYear"].map(
  (fieldName) => (
    <FormField
      key={fieldName}
      control={form.control}
      name={fieldName as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm capitalize">
            {fieldName.replace(/([A-Z])/g, " $1")}
          </FormLabel>
          <FormControl>
            <Input {...field} disabled={isAdding} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
)}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={() => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Department Image</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*" {...form.register("image")} />
                    </FormControl>
                    <FormDescription>
                      JPG, PNG, WEBP (Max 2MB)
                    </FormDescription>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="md:col-span-2 bg-yellow-500 text-black hover:bg-yellow-600"
                disabled={isAdding}
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-2" />
                )}
                Add Department
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <Card className="rounded-2xl shadow">
        <CardHeader>
          <CardTitle>Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card
                  key={dept.id}
                  className="group overflow-hidden rounded-2xl border shadow-sm hover:shadow-lg transition"
                >
                  {dept.imageUrl && (
                    <div className="relative h-36">
                      <Image
                        src={dept.imageUrl}
                        alt={dept.name}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  )}

                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-lg font-semibold">
                      {dept.name}
                    </h3>

                    {dept.headOfDepartment && (
                      <p className="text-sm text-muted-foreground">
                        Head: {dept.headOfDepartment}
                      </p>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/admin/departments/${dept.id}/view`}>
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Link>
                      </Button>

                      <Button size="sm" asChild>
                        <Link href={`/dashboard/admin/departments/${dept.id}/edit`}>
                          Edit
                        </Link>
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDeleteDepartment(dept.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
