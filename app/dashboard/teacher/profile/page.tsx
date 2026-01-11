"use client"

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Building, Award, Info } from 'lucide-react';

const ProfilePage = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return <p>Profile not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={profile.photoURL} alt={profile.displayName} />
              <AvatarFallback className="text-3xl">{profile.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{profile.displayName}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge className="mt-2">{profile.role}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <CardTitle className="text-xl mb-4 flex items-center"><User className="mr-2" /> About</CardTitle>
            <p className="text-muted-foreground">{profile.bio || "No biography provided."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><Building className="mr-2" /> Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{profile.department || "Not specified"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium flex items-center"><Award className="mr-2" /> Qualification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{profile.qualification || "Not specified"}</div>
              </CardContent>
            </Card>
          </div>

          {profile.other && (
            <div>
              <CardTitle className="text-xl mb-4 flex items-center"><Info className="mr-2" /> Additional Information</CardTitle>
              <p className="text-muted-foreground">{profile.other}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
