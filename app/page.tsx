"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CourseCard } from "@/components/course-card"
import { Testimonials } from "@/components/testimonials"
import { 
  ArrowRight, Zap, Shield, Globe, Award, BookOpen, 
  Users, CheckCircle, MessageSquare, Calendar, PlayCircle,
  GraduationCap, Briefcase, Sparkles, Star
} from "lucide-react"
import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/config"
import { collection, query, getDocs, limit } from "firebase/firestore"

interface Course {
  id: string
  title: string
  category: string
  price: number;
  description: string;
  level: string;
  teacherId: string;
  youtubePlaylistLink: string;
  thumbnail?: string;
  resources?: string[];
}

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeaturedCourses() {
      try {
        const coursesRef = collection(db, "courses")
        const q = query(coursesRef, limit(3))
        const querySnapshot = await getDocs(q)
        const fetchedCourses = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Course[]
        setFeaturedCourses(fetchedCourses)
      } catch (err: any) {
        console.error("Error fetching featured courses:", err)
        setError("Failed to load featured courses.")
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedCourses()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-yellow-50 to-white">
      <main className="pt-0">
        {/* Hero Section */}
<section className="relative py-12 md:py-20 lg:py-24 overflow-hidden min-h-[85vh] flex items-center">
  {/* Background Image - Full Visible */}
  <div className="absolute inset-0">
    <Image
      src="/hero.png"
      alt="Hero Background"
      fill
      className="object-cover"
      priority
      quality={100}
    />
    {/* Very subtle overlay for text readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
  </div>
  
  <div className="container mx-auto px-4 relative z-10">
    <div className="flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">
      {/* Badge - Clean with light border */}
      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 mb-4">
        <Zap className="h-4 w-4 text-yellow-300" />
        <span className="font-medium text-black text-sm">Learn from industry experts in Bangladesh</span>
      </div>

      {/* Main Title - Clean white text */}
      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-4">
        <span className="text-yellow-400">
          Unlock Your
        </span>
        <br />
        <span className="text-yellow-300">
          Tech Potential
        </span>
      </h1>

      {/* Description - Clean white text */}
      <p className="text-lg md:text-xl text-black max-w-2xl leading-relaxed mb-8 px-4">
        The premier EdTech platform for mastering modern skills. Enroll in high-quality courses designed to accelerate your career.
      </p>

      {/* CTA Buttons - Clean design */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link href="/courses">
          <Button 
            size="lg" 
            className="group bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold rounded-xl px-8 py-6 text-base transition-all duration-300 hover:scale-105"
          >
            <span className="flex items-center gap-3">
              Start Learning Now
              <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </span>
          </Button>
        </Link>
        <Link href="/signup">
          <Button 
            variant="outline" 
            size="lg" 
            className="border border-white/40 text-white hover:bg-white/10 rounded-xl px-8 py-6 text-base bg-transparent backdrop-blur-sm hover:scale-105 transition-all duration-300"
          >
            <Briefcase className="mr-2 h-5 w-5" />
            Become a Mentor
          </Button>
        </Link>
      </div>

      {/* Stats - Clean transparent design */}
      <div className="mt-12 pt-8 border-t border-white/20 w-full max-w-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "25K+", label: "Active Students" },
            { value: "4.9★", label: "Avg Rating" },
            { value: "98%", label: "Satisfaction" },
            { value: "500+", label: "Courses" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-xs text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>

  {/* Subtle decorative elements */}
  <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-yellow-400/5 to-amber-500/5 rounded-full blur-lg"></div>
  <div className="absolute bottom-20 right-10 w-24 h-24 bg-gradient-to-r from-amber-400/5 to-yellow-400/5 rounded-full blur-lg"></div>
</section>

        {/* Features Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white to-amber-50/30"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-amber-200 mb-6">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse"></span>
                <span className="text-sm font-semibold text-amber-700">Why Choose NexusAcademy</span>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
                  Exceptional Learning
                </span>
                <span className="block text-amber-900">Experience</span>
              </h2>
              <p className="text-lg text-amber-700/80 max-w-2xl mx-auto">
                Discover the features that make us the preferred choice for modern education
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="relative group md:col-span-2">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-amber-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative h-full flex flex-col p-8 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white via-yellow-50/50 to-amber-50/30 shadow-xl hover:shadow-2xl hover:border-yellow-400 transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 mb-8">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-amber-900 mb-4">Global Standards, Local Context</h3>
                    <p className="text-amber-700/80">
                      Our curriculum is designed by global experts but tailored for the Bangladeshi tech ecosystem.
                      Learn internationally-relevant skills applied to local market needs.
                    </p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-amber-200/50">
                    {['International curriculum standards', 'Local industry case studies'].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-amber-600 mb-2 last:mb-0">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative group">
                <div className="relative h-full flex flex-col p-8 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white via-yellow-50/50 to-amber-50/30 shadow-xl hover:shadow-2xl hover:border-yellow-400 transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 mb-6">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-900 mb-3">Secure Learning Environment</h3>
                    <p className="text-amber-700/80 text-sm">
                      Blockchain-verified certificates and secure SSLCommerz payments.
                      Your data and progress are protected with enterprise-grade security.
                    </p>
                  </div>
                  <div className="mt-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
                      <Shield className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">256-bit SSL Encryption</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative group">
                <div className="relative h-full flex flex-col p-8 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white via-yellow-50/50 to-amber-50/30 shadow-xl hover:shadow-2xl hover:border-yellow-400 transition-all duration-300">
                  <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 mb-6">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-amber-900 mb-3">Career Support & Placement</h3>
                    <p className="text-amber-700/80 text-sm">
                      Direct connections with top companies for job placements.
                      Get career guidance, resume reviews, and interview preparation.
                    </p>
                  </div>
                  <div className="mt-6">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-amber-200 overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"></div>
                      </div>
                      <span className="text-xs font-bold text-amber-700">75% placement rate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="relative group md:col-span-2 lg:col-span-4">
                <div className="relative flex flex-col md:flex-row items-center gap-8 p-8 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-white via-yellow-50/50 to-amber-50/30 shadow-xl hover:shadow-2xl hover:border-yellow-400 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                        <Users className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white animate-ping"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-3 w-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse"></div>
                      <span className="text-lg font-semibold text-amber-700">Live Community</span>
                    </div>
                    <h3 className="text-2xl font-bold text-amber-900 mb-4">Interactive Learning Hub</h3>
                    <p className="text-amber-700/80 max-w-2xl">
                      Engage with thousands of students in our 24/7 active community forums, live Q&A sessions,
                      and collaborative projects.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-6">
                      {[
                        { icon: MessageSquare, text: 'Active discussions' },
                        { icon: Calendar, text: 'Weekly live sessions' },
                        { icon: Users, text: '5,000+ members' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-amber-600">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white rounded-xl">
                      Join Community
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/80"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-yellow-300/20 to-amber-300/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-amber-300/20 to-yellow-300/10 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between mb-16 gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-amber-200 mb-4">
                  <span className="h-2 w-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"></span>
                  <span className="text-sm font-semibold text-amber-700">Featured Collection</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
                    Master In-Demand Skills
                  </span>
                  <br />
                  <span className="text-amber-900">With Expert Courses</span>
                </h2>
                
                <p className="text-lg text-amber-700/80 mb-2">
                  Handpicked courses to help you stay ahead of the curve in 2026.
                </p>
                <p className="text-amber-600">
                  Learn from industry experts and build your career with our premium collection.
                </p>
              </div>
              
              <div className="flex-shrink-0">
                <Link href="/courses">
                  <Button 
                    className="group bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-500 text-white font-bold rounded-xl px-8 py-6 text-lg shadow-lg shadow-amber-200/50 hover:shadow-amber-300/70 transition-all duration-300"
                  >
                    <span className="flex items-center gap-3">
                      Explore All Courses
                      <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Courses Grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-yellow-400 animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-amber-500 animate-pulse" />
                  </div>
                </div>
                <p className="mt-4 text-amber-700 font-medium">Loading featured courses...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-4">
                  <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Unable to load courses</h3>
                <p className="text-red-500/80">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : featuredCourses.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-dashed border-amber-200 mb-6">
                  <BookOpen className="h-12 w-12 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-amber-900 mb-3">No Featured Courses Available</h3>
                <p className="text-amber-600 max-w-md mx-auto mb-6">
                  We're curating new courses for you. Check back soon for amazing learning opportunities!
                </p>
                <Link href="/courses">
                  <Button className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white">
                    Browse All Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredCourses.map((course, index) => (
                  <div 
                    key={course.id} 
                    className="transform transition-all duration-300 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <Testimonials />

        {/* CTA Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-amber-300/5 to-transparent"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 mb-8 shadow-lg">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 bg-clip-text text-transparent">
                  Ready to Transform
                </span>
                <span className="block text-amber-900">Your Career?</span>
              </h2>
              <p className="text-xl text-amber-700/80 mb-10 max-w-2xl mx-auto">
                Join thousands of successful students who have accelerated their careers with NexusAcademy
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                <Link href="/signup">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 hover:from-yellow-500 hover:via-amber-600 hover:to-yellow-500 text-white font-bold rounded-2xl px-12 py-7 text-lg shadow-2xl shadow-amber-300/30 hover:shadow-amber-400/40 transition-all duration-300"
                  >
                    Get Started Free
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-2 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-2xl px-12 py-7 text-lg bg-white/50 backdrop-blur-sm"
                  >
                    <PlayCircle className="mr-3 h-5 w-5" />
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200/50 bg-gradient-to-b from-white to-amber-50/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2 lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-2xl text-amber-900">NexusAcademy</span>
              </Link>
              <p className="text-amber-700/80 text-sm leading-relaxed max-w-xs">
                Empowering the next generation of digital leaders in Bangladesh through accessible, high-quality education.
              </p>
            </div>
            
            {[
              {
                title: "Platform",
                links: ["All Courses", "Mentors", "Pricing", "Blog"]
              },
              {
                title: "Company",
                links: ["About Us", "Careers", "Contact", "Press"]
              },
              {
                title: "Support",
                links: ["Help Center", "Terms of Service", "Privacy Policy", "FAQ"]
              }
            ].map((column, idx) => (
              <div key={idx}>
                <h4 className="font-bold text-lg text-amber-900 mb-5">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <Link 
                        href={`/${link.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-amber-600 hover:text-amber-800 hover:underline transition-colors text-sm"
                      >
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-10 border-t border-amber-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-amber-600">© 2026 NexusAcademy. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {['Twitter', 'LinkedIn', 'Facebook', 'Instagram'].map((social) => (
                <Link 
                  key={social}
                  href="#" 
                  className="text-amber-600 hover:text-amber-800 hover:underline transition-colors text-sm"
                >
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}