"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { BookOpen, LayoutDashboard, Settings, Video, Award, LogOut, PlusCircle, BarChart3, Users, Building2, User, Trophy, CheckCircle, Sparkles, GraduationCap, Briefcase, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  const studentItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { title: "My Courses", icon: Video, href: "/dashboard/courses" },
    { title: "Certificates", icon: Award, href: "/dashboard/certificates" },
    { title: "Achievements", icon: Trophy, href: "/dashboard/achievements" },
    { title: "Profile", icon: User, href: "/dashboard/profile" },
    { title: "Settings", icon: Settings, href: "/dashboard/settings" },
  ]

  const teacherItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard/teacher" },
    { title: "My Courses", icon: Video, href: "/dashboard/teacher/courses" },
    { title: "Create Course", icon: PlusCircle, href: "/dashboard/teacher/courses/new" },
    { title: "Students", icon: Users, href: "/dashboard/teacher/students" },
    { title: "Profile", icon: User, href: "/dashboard/teacher/profile" },
    { title: "Settings", icon: Settings, href: "/dashboard/teacher/settings" },
  ]

  const adminItems = [
    { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard/admin" },
    { title: "Users", icon: Users, href: "/dashboard/admin/users" },
    { title: "Teacher Approval", icon: CheckCircle, href: "/dashboard/admin/teacher-approval" },
    { title: "Courses", icon: BookOpen, href: "/dashboard/admin/courses" },
    { title: "Departments", icon: Building2, href: "/dashboard/admin/departments" },
    { title: "Profile", icon: User, href: "/dashboard/admin/profile" },
    { title: "Settings", icon: Settings, href: "/dashboard/admin/settings" },
  ]

  const items = profile?.role === "teacher" ? teacherItems : profile?.role === "admin" ? adminItems : studentItems

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-amber-200/50 bg-gradient-to-b from-white via-yellow-50/30 to-amber-50/30">
        
        <SidebarContent className="p-4 mt-20">
          <SidebarMenu>
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={`h-12 px-4 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-amber-300 text-amber-900 shadow-sm' 
                        : 'text-amber-700 hover:bg-amber-50/50 hover:text-amber-900'
                    }`}
                  >
                    <Link href={item.href} className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                        isActive 
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white' 
                          : 'bg-amber-100 text-amber-600'
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarContent>
        
        <SidebarFooter className="p-4 border-t border-amber-200/50">
          {/* User Profile */}
          <div className="flex items-center gap-3 px-2 mb-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50/50 border border-amber-200">
            <Avatar className="h-12 w-12 border-2 border-amber-300">
              <AvatarImage src={profile?.photoURL || "/placeholder-user.jpg"} />
              <AvatarFallback className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white">
                {profile?.displayName?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-sm font-semibold text-amber-900 truncate">
                {profile?.displayName || "User"}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${
                  profile?.role === 'teacher' 
                    ? 'bg-gradient-to-r from-yellow-400/20 to-amber-500/20 text-amber-700 border border-amber-300' 
                    : profile?.role === 'admin'
                    ? 'bg-gradient-to-r from-red-400/20 to-red-500/20 text-red-700 border border-red-300'
                    : 'bg-gradient-to-r from-blue-400/20 to-blue-500/20 text-blue-700 border border-blue-300'
                }`}>
                  {profile?.role === 'teacher' ? <Briefcase className="h-3 w-3 inline mr-1" /> : 
                   profile?.role === 'admin' ? <Shield className="h-3 w-3 inline mr-1" /> : 
                   <GraduationCap className="h-3 w-3 inline mr-1" />}
                  {profile?.role || "Student"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Sign Out Button */}
          <SidebarMenuButton
            onClick={() => signOut()}
            className="h-12 px-4 rounded-xl text-amber-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
              <LogOut className="h-4 w-4 text-red-600 group-hover:text-red-700" />
            </div>
            <span className="font-medium ml-3">Sign Out</span>
          </SidebarMenuButton>

          {/* Back to Home Link */}
          <Link 
            href="/" 
            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:text-amber-800 hover:bg-amber-50/50 rounded-xl transition-colors"
          >
            <div className="w-6 h-6 rounded-md bg-amber-100 flex items-center justify-center">
              <BookOpen className="h-3 w-3 text-amber-600" />
            </div>
            Back to Homepage
          </Link>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  )
}