
import { db } from "@/lib/firebase/config"
import { User } from "@/lib/types"
import { collection, query, orderBy, getDocs } from "firebase/firestore"

export async function getUsers(): Promise<User[]> {
  const usersCollectionRef = collection(db, "users")
  const q = query(usersCollectionRef, orderBy("coins", "desc"))
  const usersSnapshot = await getDocs(q)
  const users = usersSnapshot.docs.map((doc) => doc.data() as User)

  return users
}
