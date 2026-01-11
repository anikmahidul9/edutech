"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, AlertTriangle, PlayCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface Quiz {
  id: string;
  title: string;
  description?: string;
  section: string;
  courseId: string;
  teacherId: string;
}

export default function SectionQuizzesPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const sectionNumber = params.sectionNumber as string
  const router = useRouter()

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courseId || !sectionNumber) return;

    const fetchQuizzesForSection = async () => {
      try {
        const quizzesRef = collection(db, "quizzes");
        const q = query(
          quizzesRef,
          where("courseId", "==", courseId),
          where("section", "==", sectionNumber)
        );
        const querySnapshot = await getDocs(q);
        const fetchedQuizzes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
        setQuizzes(fetchedQuizzes);
      } catch (err) {
        console.error("Error fetching quizzes for section:", err);
        setError("Failed to load quizzes for this section.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzesForSection();
  }, [courseId, sectionNumber]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-4">Quizzes for Section {sectionNumber}</h1>
      <p className="text-muted-foreground mb-8">Select a quiz to start.</p>

      {quizzes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <PlayCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No quizzes found for this section.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The instructor has not added any quizzes to this section yet.
          </p>
          <Button onClick={() => router.push(`/courses/${courseId}`)} className="mt-6">
            Back to Course
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                {quiz.description && <CardDescription>{quiz.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={`/courses/${courseId}/quiz/${quiz.id}`}>Start Quiz</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
