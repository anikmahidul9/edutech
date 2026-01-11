"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Loader2, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Mentor {
  uid: string
  displayName: string
  photoURL?: string
  bio?: string
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMentors() {
      try {
        const usersRef = collection(db, "users")
        const q = query(usersRef, where("role", "==", "teacher"))
        const querySnapshot = await getDocs(q)
        const fetchedMentors = querySnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...doc.data(),
        })) as Mentor[]
        setMentors(fetchedMentors)
      } catch (err: any) {
        console.error("Error fetching mentors:", err)
        setError("Failed to load mentors. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchMentors()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Our Expert Mentors</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Learn from the best in the industry. Our mentors are here to guide you on your learning journey.
        </p>
      </div>

      {mentors.length === 0 ? (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">No mentors found.</h3>
          <p className="text-muted-foreground mt-2">
            We're always looking for new talent! Perhaps you could be our next mentor?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {mentors.map((mentor) => (
            <Card key={mentor.uid} className="flex flex-col items-center text-center p-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={mentor.photoURL || "/placeholder-user.jpg"} alt={mentor.displayName} />
                <AvatarFallback className="text-3xl font-bold">{mentor.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl font-semibold">{mentor.displayName}</CardTitle>
              <CardContent className="text-muted-foreground text-sm mt-2 p-0">
                <p className="line-clamp-3">{mentor.bio || "No bio available."}</p>
              </CardContent>
              <Link href={`/mentors/${mentor.uid}`} className="mt-4">
                <Button variant="outline" size="sm">View Profile</Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
