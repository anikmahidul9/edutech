"use client"

import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { User, LogOut, Menu, Coins, Home, BookOpen, Trophy, Info, GraduationCap, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { useState } from "react"

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/departments", label: "Departments", icon: GraduationCap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/about", label: "About Us", icon: Info },
]

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      setIsScrolled(window.scrollY > 10)
    })
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? 'border-b border-amber-200/50 bg-white/90 backdrop-blur-lg shadow-sm' 
        : 'bg-gradient-to-b from-white to-amber-50/30'
    }`}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
          <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-amber-900 tracking-tight">NexusAcademy</span>
            <span className="text-xs text-amber-600 font-medium">Learn • Grow • Succeed</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-700 hover:text-amber-900 hover:bg-amber-50/50 transition-all duration-200 group"
              >
                <Icon className="h-4 w-4 text-amber-500 group-hover:text-amber-600" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {/* Coins Display (Students only) */}
              {profile?.role === "student" && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
                    <Coins className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-amber-600">Your Balance</span>
                    <span className="font-bold text-amber-800">{profile?.coins ?? 0} Coins</span>
                  </div>
                </div>
              )}

              {/* Dashboard Button */}
              <Link href="/dashboard">
                <Button 
                  variant="outline" 
                  className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>

              {/* Sign Out Button */}
              <Button 
                onClick={() => signOut()} 
                className="gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              {/* Login Button */}
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
                >
                  Login
                </Button>
              </Link>

              {/* Get Started Button */}
              <Link href="/signup">
                <Button 
                  className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl px-6"
                >
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="icon"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs border-amber-200 bg-gradient-to-b from-white to-amber-50/50">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="p-6 border-b border-amber-200">
                  <Link href="/" className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-xl text-amber-900">NexusAcademy</span>
                      <p className="text-xs text-amber-600">Learn • Grow • Succeed</p>
                    </div>
                  </Link>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 p-6">
                  <div className="space-y-2">
                    {navLinks.map((link) => {
                      const Icon = link.icon
                      return (
                        <SheetClose key={link.href} asChild>
                          <Link 
                            href={link.href} 
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-amber-700 hover:text-amber-900 hover:bg-amber-50/50 transition-colors"
                          >
                            <Icon className="h-5 w-5 text-amber-500" />
                            <span className="font-medium">{link.label}</span>
                          </Link>
                        </SheetClose>
                      )
                    })}
                  </div>
                </nav>

                {/* Mobile User Actions */}
                <div className="p-6 border-t border-amber-200/50 space-y-4">
                  {user ? (
                    <>
                      {/* Coins Display */}
                      {profile?.role === "student" && (
                        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
                              <Coins className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-sm text-amber-600">Your Balance</p>
                              <p className="font-bold text-amber-800 text-lg">{profile?.coins ?? 0} Coins</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dashboard Button */}
                      <SheetClose asChild>
                        <Link href="/dashboard">
                          <Button 
                            variant="outline" 
                            className="w-full justify-start gap-3 border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            <User className="h-5 w-5" />
                            Dashboard
                          </Button>
                        </Link>
                      </SheetClose>

                      {/* Sign Out Button */}
                      <Button 
                        onClick={() => signOut()} 
                        className="w-full justify-start gap-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Login Button */}
                      <SheetClose asChild>
                        <Link href="/login">
                          <Button 
                            variant="outline" 
                            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            Login
                          </Button>
                        </Link>
                      </SheetClose>

                      {/* Get Started Button */}
                      <SheetClose asChild>
                        <Link href="/signup">
                          <Button 
                            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
                          >
                            Get Started
                          </Button>
                        </Link>
                      </SheetClose>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}