import { db } from "@/lib/firebase/config"
import { User } from "@/lib/types"
import { collection, query, where, getDocs } from "firebase/firestore"

export async function getTeachers(): Promise<User[]> {
  const usersCollectionRef = collection(db, "users")
  const q = query(usersCollectionRef, where("role", "==", "teacher"))
  const usersSnapshot = await getDocs(q)
  const teachers = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)

  return teachers
}
