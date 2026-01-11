
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs, documentId } from "firebase/firestore" // Import documentId
import { Course } from "@/lib/types"

export async function getUserCourses(uid: string): Promise<Course[]> {
  console.log("getUserCourses called with uid:", uid)
  if (!uid) {
    console.log("UID is undefined, returning empty array.")
    return []
  }

  // Query the 'enrollments' collection for the current user's enrollments
  const enrollmentsRef = collection(db, "enrollments")
  const q = query(enrollmentsRef, where("userId", "==", uid))
  const enrollmentsSnapshot = await getDocs(q)

  const courseIds: string[] = []
  enrollmentsSnapshot.forEach((doc) => {
    courseIds.push(doc.data().courseId)
  })
  console.log("Found enrolled course IDs:", courseIds)

  if (courseIds.length === 0) {
    console.log("No enrolled courses found for uid:", uid)
    return []
  }

  // Now fetch the actual course details from the 'courses' collection using documentId()
  const coursesRef = collection(db, "courses")
  const coursesQuery = query(coursesRef, where(documentId(), "in", courseIds)) // Use documentId()
  const coursesSnapshot = await getDocs(coursesQuery)

  const courses = coursesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Course))
  console.log("Fetched courses:", courses)

  return courses
}
