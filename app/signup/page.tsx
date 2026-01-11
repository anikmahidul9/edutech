"use client"

import type React from "react"
import { GuestGuard } from "@/components/guest-guard"
import { useState, useEffect } from "react"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Mail, Lock, User, GraduationCap, Briefcase, Sparkles, Award, FileText } from "lucide-react"
import { toast } from "sonner"

interface Department {
  id: string;
  name: string;
}

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState("student")
  const [studentId, setStudentId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [qualification, setQualification] = useState("")
  const [bio, setBio] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch("/api/departments")
        if (!response.ok) throw new Error("Failed to fetch departments")
        const data = await response.json()
        setDepartments(data)
      } catch (error: any) {
        toast.error("Error fetching departments.")
      } finally {
        setLoadingDepartments(false)
      }
    }
    fetchDepartments()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Simple validation
    if (role === "student" && !studentId) {
      setError("Student ID is required")
      return
    }
    if (!departmentId) {
      setError("Department is required")
      return
    }
    if (role === "teacher" && !qualification) {
      setError("Qualification is required for instructors")
      return
    }
    
    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile
      await updateProfile(user, { displayName: name })

      // Create user data
      const userData: any = {
        uid: user.uid,
        email: user.email,
        displayName: name,
        role: role,
        createdAt: new Date().toISOString(),
        isApproved: role === "student", // Teachers need approval
        departmentId: departmentId,
      };

      if (role === "student") {
        userData.studentId = studentId;
      } else if (role === "teacher") {
        userData.qualification = qualification;
        userData.bio = bio;
      }

      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), userData)

      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Signup error:", err)
      setError(err.message || "Failed to create account")
      toast.error("Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <GuestGuard>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-4 flex items-center justify-center">
        {/* Background decor */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-gradient-to-r from-yellow-300/20 to-amber-300/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-gradient-to-r from-amber-300/20 to-yellow-300/10 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md border-none bg-white/80 backdrop-blur-sm shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-t-2xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 mb-4">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/90">Join NexusAcademy today</p>
          </div>

          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-amber-900 font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-amber-900 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-amber-900 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg"
                  />
                </div>
                <p className="text-xs text-amber-600">Minimum 6 characters</p>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-amber-900 font-medium">
                  I am a...
                </Label>
                <Select value={role} onValueChange={setRole} disabled={loading}>
                  <SelectTrigger className="bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Student
                      </div>
                    </SelectItem>
                    <SelectItem value="teacher">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Instructor
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student ID (only for students) */}
              {role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-amber-900 font-medium">
                    Student ID
                  </Label>
                  <Input
                    id="studentId"
                    placeholder="e.g., S12345"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    disabled={loading}
                    className="bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg"
                  />
                </div>
              )}

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-amber-900 font-medium">
                  Department
                </Label>
                <Select value={departmentId} onValueChange={setDepartmentId} disabled={loading || loadingDepartments}>
                  <SelectTrigger className="bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg">
                    <SelectValue placeholder={loadingDepartments ? "Loading..." : "Select department"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Instructor-specific fields */}
              {role === "teacher" && (
                <>
                  {/* Qualification */}
                  <div className="space-y-2">
                    <Label htmlFor="qualification" className="text-amber-900 font-medium flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Qualification
                    </Label>
                    <div className="relative">
                      <Award className="absolute left-3 top-3 h-4 w-4 text-amber-400" />
                      <Input
                        id="qualification"
                        placeholder="e.g., PhD in Computer Science"
                        required
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        disabled={loading}
                        className="pl-10 bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-amber-900 font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Biography (Optional)
                    </Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about your experience and expertise..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={loading}
                      className="bg-white/50 border-amber-200 focus:border-yellow-400 rounded-lg min-h-[100px] resize-none"
                    />
                  </div>

                  {/* Note for instructors */}
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-700">
                      <span className="font-semibold">Note:</span> Instructor accounts require admin approval before you can create courses.
                    </p>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold rounded-lg py-3 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/80 text-amber-600">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link 
                href="/login"
                className="inline-block w-full py-3 rounded-lg border-2 border-amber-300 text-amber-700 font-medium hover:bg-amber-50 transition-colors"
              >
                Sign In Instead
              </Link>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-6 pt-0">
            <p className="text-center text-sm text-amber-600/70 w-full">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>
      </div>
    </GuestGuard>
  )
}