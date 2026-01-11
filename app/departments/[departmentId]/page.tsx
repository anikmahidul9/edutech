"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import { doc, getDoc } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Mail, Calendar, User, Info, Building } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface Department {
  id: string;
  name: string;
  headOfDepartment?: string;
  contactEmail?: string;
  description?: string;
  establishedYear?: number;
  imageUrl?: string;
}

export default function DepartmentDetailPage() {
  const params = useParams()
  const departmentId = params.departmentId as string
  const router = useRouter()

  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!departmentId) return

    const fetchDepartment = async () => {
      try {
        const departmentDocRef = doc(db, "departments", departmentId)
        const departmentSnap = await getDoc(departmentDocRef)

        if (departmentSnap.exists()) {
          setDepartment({ id: departmentSnap.id, ...departmentSnap.data() } as Department)
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
  }, [departmentId])

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
        <Building className="h-12 w-12 text-destructive mb-4" />
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
        Back to Departments
      </Button>

      <Card className="max-w-3xl mx-auto">
        <CardHeader className="relative p-0">
          {department.imageUrl ? (
            <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
              <Image src={department.imageUrl} alt={department.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-48 w-full bg-muted rounded-t-lg flex items-center justify-center">
              <Building className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
          <CardTitle className="absolute bottom-4 left-4 text-white text-3xl font-bold z-10">
            {department.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {department.description && (
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2"><Info className="mr-2 h-5 w-5" /> Description</h3>
              <p className="text-muted-foreground">{department.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {department.headOfDepartment && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Head of Department</p>
                  <p className="font-medium">{department.headOfDepartment}</p>
                </div>
              </div>
            )}
            {department.contactEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Contact Email</p>
                  <p className="font-medium">{department.contactEmail}</p>
                </div>
              </div>
            )}
            {department.establishedYear && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Established Year</p>
                  <p className="font-medium">{department.establishedYear}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
