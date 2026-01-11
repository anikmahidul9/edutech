"use client"

import { useState, useEffect } from "react"
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Calendar, Info } from 'lucide-react';

interface AdminProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  createdAt?: string;
  role: string;
  // Add any other admin-specific fields you might have
}

export default function AdminProfilePage() {
  const { user, profile, loading } = useAuth();
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    if (profile && profile.role === "admin") {
      setAdminProfile({
        displayName: profile.displayName || "Admin User",
        email: profile.email || "N/A",
        photoURL: profile.photoURL,
        bio: profile.bio,
        createdAt: profile.createdAt, // Assuming createdAt is part of profile
        role: profile.role,
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminProfile) {
    return <p>Admin profile not found or you do not have admin privileges.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={adminProfile.photoURL} alt={adminProfile.displayName} />
              <AvatarFallback className="text-3xl">{adminProfile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{adminProfile.displayName}</h1>
              <p className="text-muted-foreground">{adminProfile.email}</p>
              <Badge className="mt-2">{adminProfile.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {adminProfile.bio && (
            <div>
              <h3 className="text-lg font-semibold flex items-center mb-2"><Info className="mr-2 h-5 w-5" /> About</h3>
              <p className="text-muted-foreground">{adminProfile.bio}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{adminProfile.email}</p>
              </div>
            </div>
            {adminProfile.createdAt && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-medium">{new Date(adminProfile.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
