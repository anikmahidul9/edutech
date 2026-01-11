"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
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
import { db } from "@/lib/firebase/config"
import { doc, updateDoc, collection, getDocs } from "firebase/firestore"
import { Loader2 } from "lucide-react"

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().or(z.literal("")),
  department: z.string().optional().or(z.literal("")),
  qualification: z.string().optional().or(z.literal("")),
  other: z.string().optional().or(z.literal("")),
  photo: z.any()
    .refine((files) => files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, `Max image size is 2MB.`)
    .refine(
      (files) => files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ).optional(),
})

interface Department {
  id: string;
  name: string;
}

export default function TeacherSettingsPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  useEffect(() => {
    const fetchDepartments = async () => {
      const querySnapshot = await getDocs(collection(db, "departments"));
      const depts = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
      setDepartments(depts);
    };
    fetchDepartments();
  }, []);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || "",
      bio: profile?.bio || "",
      department: profile?.department || "",
      qualification: profile?.qualification || "",
      other: profile?.other || "",
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        department: profile.department || "",
        qualification: profile.qualification || "",
        other: profile.other || "",
      })
    }
  }, [profile, form])

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

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user || !profile) {
      toast.error("User not authenticated.")
      return
    }

    setIsSubmitting(true)

    try {
      let photoURL = profile.photoURL || ""
      if (values.photo && values.photo.length > 0) {
        photoURL = await uploadFile(values.photo[0], "image");
      }

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        displayName: values.displayName,
        bio: values.bio,
        department: values.department,
        qualification: values.qualification,
        other: values.other,
        photoURL: photoURL,
      })

      toast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error updating profile: ", error)
      toast.error(error.message || "Failed to update profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Public Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.photoURL || "/placeholder-user.jpg"} alt={profile?.displayName || "User"} />
                  <AvatarFallback>{profile?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="file" accept="image/*" {...form.register("photo")} className="w-auto" />
                      </FormControl>
                      <FormDescription>
                        Upload a new profile picture (Max 2MB, JPG, PNG, WEBP).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your Email"
                  value={user?.email || ""}
                  disabled
                />
              </div>
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map(dep => (
                          <SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualification</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. PhD in Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself"
                        className="resize-none"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="other"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other relevant information"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}