"use client"

import type React from "react"
import { GuestGuard } from "@/components/guest-guard"
import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/config"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, Lock, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success("Welcome back!")
      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      setError("Invalid email or password")
      toast.error("Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <GuestGuard>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100 p-4 flex items-center justify-center">
        {/* Decorative background */}
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
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/90">Sign in to your account</p>
          </div>

          <CardContent className="p-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-amber-900 font-medium">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-amber-600 hover:text-amber-800 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
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
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold rounded-lg py-3 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-amber-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white/80 text-amber-600">Don't have an account?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link 
                href="/signup"
                className="inline-block w-full py-3 rounded-lg border-2 border-amber-300 text-amber-700 font-medium hover:bg-amber-50 transition-colors"
              >
                Create New Account
              </Link>
            </div>
          </CardContent>

          {/* Footer */}
          <CardFooter className="p-6 pt-0">
            <p className="text-center text-sm text-amber-600/70 w-full">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardFooter>
        </Card>
      </div>
    </GuestGuard>
  )
}