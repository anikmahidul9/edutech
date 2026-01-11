"use client"

import { useState, useEffect } from "react"
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Calendar, Info, GraduationCap, Building } from 'lucide-react';
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface StudentProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt?: string;
  role: string;
  studentId?: string;
  departmentId?: string;
  departmentName?: string;
}

export default function StudentProfilePage() {
  const { user, profile, loading } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [departmentName, setDepartmentName] = useState<string | null>(null);

  useEffect(() => {
    if (profile && profile.role === "student") {
      setStudentProfile({
        displayName: profile.displayName || "Student User",
        email: profile.email || "N/A",
        photoURL: profile.photoURL,
        bio: profile.bio,
        createdAt: profile.createdAt,
        role: profile.role,
        studentId: profile.studentId,
        departmentId: profile.departmentId,
      });

      if (profile.departmentId) {
        const fetchDepartmentName = async () => {
          const deptDoc = await getDoc(doc(db, "departments", profile.departmentId as string));
          if (deptDoc.exists()) {
            setDepartmentName(deptDoc.data().name);
          }
        };
        fetchDepartmentName();
      }
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!studentProfile) {
    return <p>Student profile not found or you do not have student privileges.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={studentProfile.photoURL} alt={studentProfile.displayName} />
              <AvatarFallback className="text-3xl">{studentProfile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{studentProfile.displayName}</h1>
              <p className="text-muted-foreground">{studentProfile.email}</p>
              <Badge className="mt-2">{studentProfile.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {studentProfile.bio && (
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2"><Info className="mr-2 h-5 w-5" /> About</h3>
              <p className="text-muted-foreground">{studentProfile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{studentProfile.email}</p>
              </div>
            </div>
            {studentProfile.createdAt && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{new Date(studentProfile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {studentProfile.studentId && (
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-medium">{studentProfile.studentId}</p>
                </div>
              </div>
            )}
            {departmentName && (
              <div className="flex items-center gap-3">
                <Building className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{departmentName}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
