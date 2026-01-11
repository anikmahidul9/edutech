"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, getDocs, orderBy } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Building, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Department {
  id: string;
  name: string;
  headOfDepartment?: string;
  contactEmail?: string;
  description?: string;
  establishedYear?: number;
  imageUrl?: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments")
        if (!response.ok) {
          throw new Error("Failed to fetch departments")
        }
        const data = await response.json()
        setDepartments(data)
      } catch (err: any) {
        console.error("Error fetching departments:", err)
        setError(err.message || "Failed to load departments.")
      } finally {
        setLoading(false)
      }
    }
    fetchDepartments()
  }, [])

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
        <h2 className="text-xl font-semibold text-destructive">Error Loading Departments</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Our Departments</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Explore the various academic departments and their offerings.
        </p>
      </div>

      {departments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Building className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No departments found.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            It looks like there are no departments registered yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id} className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              {dept.imageUrl ? (
                <div className="relative h-40 w-full overflow-hidden">
                  <Image
                    src={dept.imageUrl}
                    alt={dept.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
              ) : (
                <div className="relative h-40 w-full bg-muted flex items-center justify-center rounded-t-xl">
                  <Building className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <CardContent className="p-5 space-y-3">
                <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {dept.name}
                </CardTitle>
                {dept.headOfDepartment && <p className="text-sm text-muted-foreground">Head: {dept.headOfDepartment}</p>}
                {dept.establishedYear && <p className="text-sm text-muted-foreground">Established: {dept.establishedYear}</p>}
                <Button asChild size="sm" className="w-full mt-4">
                  <Link href={`/departments/${dept.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
