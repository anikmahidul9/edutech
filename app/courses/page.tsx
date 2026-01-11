"use client"

import { useState, useEffect, useMemo } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, getDocs, where } from "firebase/firestore"
import { Loader2, Search } from "lucide-react"
import { CourseCard } from "@/components/course-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

interface Course {
  id: string
  title: string
  category: string
  description: string;
  level: string;
  teacherId: string;
  youtubePlaylistLink: string;
  thumbnail?: string;
  resources?: string[];
  departmentId?: string;
  status: "pending" | "published" | "rejected";
}

interface Department {
  id: string;
  name: string;
}

export default function CoursesPage() {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("none")
  const [searchTerm, setSearchTerm] = useState<string>("")

  useEffect(() => {
    async function fetchCourses() {
      try {
        const q = query(collection(db, "courses"), where("status", "==", "published"))
        const querySnapshot = await getDocs(q)
        const fetchedCourses = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[]
        setAllCourses(fetchedCourses)
      } catch (err: any) {
        console.error("Error fetching courses:", err)
        setError(`Failed to fetch courses. ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const response = await fetch("/api/departments");
        if (!response.ok) {
          throw new Error("Failed to fetch departments");
        }
        const data = await response.json();
        setDepartments(data);
      } catch (err: any) {
        console.error("Error fetching departments:", err);
      } finally {
        setLoadingDepartments(false);
      }
    }
    fetchDepartments();
  }, []);

  const filteredAndSortedCourses = useMemo(() => {
    let currentCourses = [...allCourses]

    if (selectedDepartment !== "all") {
      currentCourses = currentCourses.filter((course) => course.departmentId === selectedDepartment)
    }

    if (searchTerm) {
      currentCourses = currentCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return currentCourses
  }, [allCourses, selectedDepartment, searchTerm])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Explore Our Courses</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Find the perfect course to boost your skills, from programming to design and beyond.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            className="w-full pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={loadingDepartments}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex h-[30vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-destructive/10 p-4 text-center text-destructive">{error}</div>
      ) : filteredAndSortedCourses.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold">No courses found matching your criteria.</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  )
}
