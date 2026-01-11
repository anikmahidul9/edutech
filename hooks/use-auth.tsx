"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { onAuthStateChanged, type User as FirebaseUser, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"

interface UserProfile {
  uid: string
  email: string | null
  role: "student" | "teacher" | "admin"
  displayName: string | null
  photoURL: string | null
  isApproved?: boolean
  coins?: number
  // New fields
  studentId?: string;
  departmentId?: string;
  qualification?: string;
  bio?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  emailNotifications?: boolean;
  maintenanceMode?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  error: string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  error: null,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setError(null)

      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            const userProfile = userDoc.data() as UserProfile;
            // Check approval status for teachers
            if (userProfile.role === "teacher" && userProfile.isApproved === false) {
              await firebaseSignOut(auth);
              setError("Your teacher account is pending approval. Please wait for an administrator to approve your account.");
              setProfile(null);
              setUser(null); // Clear firebaseUser as well
            } else {
              setProfile(userProfile);
            }
          } else {
            const defaultProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              role: "student",
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              isApproved: true, // Default to approved for students
            }
            setProfile(defaultProfile)
          }
        } catch (err: any) {
          console.error("[v0] Error fetching user profile:", err)
          setError(err.message || "Failed to load user profile")
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setError(null)
    } catch (err: any) {
      console.error("[v0] Error signing out:", err)
      setError(err.message || "Failed to sign out")
    }
  }

  return <AuthContext.Provider value={{ user, profile, loading, signOut, error }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
