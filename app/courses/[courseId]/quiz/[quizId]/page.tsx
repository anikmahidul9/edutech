"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { doc, updateDoc, increment, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, AlertTriangle } from "lucide-react"

interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  section: string;
  questions: Question[];
  courseId: string;
  teacherId: string;
}

export default function QuizPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const quizId = params.quizId as string
  const { user, profile } = useAuth()
  const router = useRouter()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [passed, setPassed] = useState(false)
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false)

  useEffect(() => {
    if (!quizId) return;

    const fetchQuiz = async () => {
      try {
        const quizDocRef = doc(db, "quizzes", quizId);
        const quizSnap = await getDoc(quizDocRef);

        if (quizSnap.exists()) {
          const fetchedQuiz = { id: quizSnap.id, ...quizSnap.data() } as Quiz;
          setQuiz(fetchedQuiz);
          console.log("Fetched quiz data:", fetchedQuiz); // Added log
        } else {
          setError("Quiz not found.");
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        setError("Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  useEffect(() => {
    if (!user || !quizId) return;

    const checkCompletion = async () => {
      try {
        const completionDocRef = doc(db, "users", user.uid, "completedQuizzes", quizId);
        const completionSnap = await getDoc(completionDocRef);
        if (completionSnap.exists()) {
          setHasCompletedQuiz(true);
        }
      } catch (err) {
        console.error("Error checking quiz completion:", err);
      }
    };

    checkCompletion();
  }, [user, quizId]);

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: answer }))
  }

  const handleSubmit = async () => {
    console.log("handleSubmit called.");
    if (!quiz) return;

    if (Object.keys(selectedAnswers).length !== quiz.questions.length) {
      toast.error("Please answer all questions.")
      return
    }

    setSubmitted(true)
    let currentScore = 0
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) { // Changed from q.answer to q.correctAnswer
        currentScore++
      }
    })
    setScore(currentScore);

    const percentage = (currentScore / quiz.questions.length) * 100;
    console.log("Quiz percentage:", percentage);

    if (percentage >= 70) {
      console.log("Quiz passed (percentage >= 70).");
      setPassed(true);
      const coinsToAward = 10
      if (user && !hasCompletedQuiz) { // Only award if not already completed
        console.log("User is logged in and quiz not completed yet. Attempting to award coins and record completion...");
        const userRef = doc(db, "users", user.uid)
        try {
          await updateDoc(userRef, {
            coins: increment(coinsToAward),
          })
          console.log(`Successfully awarded ${coinsToAward} coins to user ${user.uid}.`);
        } catch (coinError) {
          console.error("Error awarding coins:", coinError);
          toast.error("Failed to award coins. Please check console for details.");
        }

        // Record quiz completion
        const completionDocRef = doc(db, "users", user.uid, "completedQuizzes", quizId);
        try {
          await setDoc(completionDocRef, {
            completedAt: new Date(),
            score: currentScore,
            totalQuestions: quiz.questions.length,
            quizTitle: quiz.title,
            courseId: courseId, // Added courseId for easier querying
          }, { merge: true }); // Use merge to avoid overwriting other fields if they exist
          console.log(`Successfully recorded completion for quiz ${quizId} for user ${user.uid}.`);
        } catch (completionError) {
          console.error("Error recording quiz completion:", completionError);
          toast.error("Failed to record quiz completion. Please check console for details.");
        }

        setHasCompletedQuiz(true); // Update state to reflect completion
        toast.success(`Congratulations! You passed the quiz and earned ${coinsToAward} coins.`)

        // --- Calculate and update course progress based on quizzes ---
        try {
          console.log("Attempting to calculate and update course progress...");
          // 1. Get all quizzes for this course
          const allQuizzesRef = collection(db, "quizzes");
          const allQuizzesQ = query(allQuizzesRef, where("courseId", "==", courseId));
          const allQuizzesSnap = await getDocs(allQuizzesQ);
          const totalQuizzesInCourse = allQuizzesSnap.size;
          console.log("Total quizzes in course:", totalQuizzesInCourse);

          if (totalQuizzesInCourse > 0) {
            // 2. Get all completed quizzes for this user and course
            const completedQuizzesRef = collection(db, "users", user.uid, "completedQuizzes");
            const completedQuizzesQ = query(completedQuizzesRef, where("courseId", "==", courseId));
            const completedQuizzesSnap = await getDocs(completedQuizzesQ);
            const completedQuizzesCount = completedQuizzesSnap.size;
            console.log("Completed quizzes for this course by user:", completedQuizzesCount);

            // 3. Calculate new progress percentage
            const newProgress = Math.round((completedQuizzesCount / totalQuizzesInCourse) * 100);
            console.log("Calculated new progress:", newProgress);

            // 4. Update enrollment document
            const enrollmentQ = query(
              collection(db, "enrollments"),
              where("userId", "==", user.uid),
              where("courseId", "==", courseId)
            );
            const enrollmentSnap = await getDocs(enrollmentQ);

            if (!enrollmentSnap.empty) {
              const enrollmentDocRef = doc(db, "enrollments", enrollmentSnap.docs[0].id);
              await updateDoc(enrollmentDocRef, {
                progress: newProgress,
                status: newProgress === 100 ? "completed" : "active", // Mark as completed if 100%
              });
              console.log(`Enrollment progress updated to ${newProgress}% for course ${courseId}.`);
            } else {
              console.warn("Enrollment document not found for user and course. Cannot update progress.");
            }
          } else {
            console.log("No quizzes in this course, progress remains 0.");
          }
        } catch (progressError) {
          console.error("Error updating course progress:", progressError);
          toast.error("Failed to update course progress. Check console for details.");
        }
        // --- End calculate and update course progress ---

      } else if (user && hasCompletedQuiz) {
        console.log("User is logged in but quiz already completed. Skipping coin award and progress update.");
        toast.info("You have already completed this quiz successfully.")
      } else {
        console.log("User not logged in or other condition not met for coin award/progress update.");
        toast.success("Congratulations! You passed the quiz.")
      }
    } else {
      console.log("Quiz not passed (percentage < 70).");
      setPassed(false);
      toast.error("You did not pass the quiz. Please try again.")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Quiz Not Found</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  if (!quiz) {
    return null;
  }

 return (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-background dark:via-background dark:to-muted py-12">
    <div className="mx-auto max-w-4xl px-4">

      {/* Header */}
      <div className="sticky top-0 z-10 mb-8 rounded-2xl border bg-white/90 backdrop-blur dark:bg-background/80 shadow-sm">
        <div className="p-6 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-muted-foreground text-sm">
              {quiz.description}
            </p>
          )}

          {/* Progress */}
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(Object.keys(selectedAnswers).length / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Answered {Object.keys(selectedAnswers).length} of {quiz.questions.length}
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-10">
        {quiz.questions.map((q, index) => {
          const userAnswer = selectedAnswers[index]
          const isCorrect = userAnswer === q.correctAnswer

          return (
            <div
              key={index}
              className={`rounded-2xl border p-6 shadow-sm transition-all
                ${
                  submitted
                    ? isCorrect
                      ? "border-green-500/40 bg-green-50 dark:bg-green-950/20"
                      : "border-red-500/40 bg-red-50 dark:bg-red-950/20"
                    : "hover:shadow-md bg-white dark:bg-background"
                }
              `}
            >
              {/* Question */}
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold leading-snug">
                  {q.questionText}
                </h3>
              </div>

              {/* Options */}
              <RadioGroup
                className="mt-6 space-y-4"
                disabled={submitted}
                onValueChange={(value) =>
                  handleAnswerChange(index, value)
                }
              >
                {q.options.map((option) => {
                  const selected = userAnswer === option
                  const correct = submitted && option === q.correctAnswer
                  const wrong = submitted && selected && !correct

                  return (
                    <label
                      key={option}
                      htmlFor={`${index}-${option}`}
                      className={`flex items-center gap-4 rounded-xl border px-5 py-4 cursor-pointer transition-all
                        ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted/60"
                        }
                        ${
                          correct
                            ? "border-green-500 bg-green-100 dark:bg-green-900/20"
                            : ""
                        }
                        ${
                          wrong
                            ? "border-red-500 bg-red-100 dark:bg-red-900/20"
                            : ""
                        }
                        ${submitted && "cursor-not-allowed"}
                      `}
                    >
                      <RadioGroupItem
                        id={`${index}-${option}`}
                        value={option}
                      />
                      <span className="text-sm font-medium">
                        {option}
                      </span>
                    </label>
                  )
                })}
              </RadioGroup>

              {/* Feedback */}
              {submitted && (
                <div className="mt-4 text-sm font-semibold">
                  {isCorrect ? (
                    <span className="text-green-600">
                      ✔ Correct answer
                    </span>
                  ) : (
                    <span className="text-red-600">
                      ✘ Correct answer: {q.correctAnswer}
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Submit */}
      <div className="mt-12 flex justify-center">
        <Button
          size="lg"
          disabled={submitted || hasCompletedQuiz}
          onClick={handleSubmit}
          className="px-12 text-base"
        >
          {hasCompletedQuiz
            ? "Quiz Completed"
            : submitted
            ? "Submitted"
            : "Submit Quiz"}
        </Button>
      </div>

      {/* Result */}
      {submitted && (
        <div className="mt-10 rounded-2xl border bg-white dark:bg-background p-8 shadow-md text-center space-y-4">
          <p className="text-xl font-bold">
            Score: {score} / {quiz.questions.length}
          </p>

          <p
            className={`text-2xl font-extrabold ${
              passed ? "text-green-600" : "text-red-600"
            }`}
          >
            {passed ? "🎉 You Passed!" : "❌ You Did Not Pass"}
          </p>

          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/courses/${courseId}`)}
          >
            Back to Course
          </Button>
        </div>
      )}
    </div>
  </div>
)
}
