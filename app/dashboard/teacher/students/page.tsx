"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users } from 'lucide-react';

interface Course {
  id: string;
  title: string;
}

interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  status: 'active' | 'completed';
  enrolledAt: Date;
}

interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
}

interface StudentProgress {
  enrollment: Enrollment;
  user: User;
  course: Course;
}

const StudentProgressPage = () => {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchTeacherCourses = async () => {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('teacherId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const teacherCourses: Course[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      return teacherCourses;
    };

    const setupRealtimeListeners = (courses: Course[]) => {
      if (courses.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = courses.map(c => c.id);
      const enrollmentsRef = collection(db, 'enrollments');
      const q = query(enrollmentsRef, where('courseId', 'in', courseIds));

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const enrollments: Enrollment[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          enrolledAt: doc.data().enrolledAt.toDate(),
        } as Enrollment));

        if (enrollments.length > 0) {
          const userIds = [...new Set(enrollments.map(e => e.userId))];
          const usersRef = collection(db, 'users');
          const usersQuery = query(usersRef, where('__name__', 'in', userIds));
          const usersSnapshot = await getDocs(usersQuery);
          const usersMap = new Map<string, User>();
          usersSnapshot.docs.forEach(doc => {
            usersMap.set(doc.id, { id: doc.id, ...doc.data() } as User);
          });

          const coursesMap = new Map<string, Course>(courses.map(c => [c.id, c]));

          const progressData: StudentProgress[] = enrollments.map(enrollment => ({
            enrollment,
            user: usersMap.get(enrollment.userId)!,
            course: coursesMap.get(enrollment.courseId)!,
          })).filter(item => item.user && item.course); // Filter out items where user or course might be missing

          setStudentProgress(progressData);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to enrollments:", error);
        setLoading(false);
      });

      return unsubscribe;
    };

    const initialize = async () => {
      setLoading(true);
      const courses = await fetchTeacherCourses();
      const unsubscribe = setupRealtimeListeners(courses);
      return () => unsubscribe && unsubscribe();
    };

    initialize();

  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading student data...</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2" />
          Student Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {studentProgress.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-center">Progress</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Enrolled On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentProgress.sort((a, b) => b.enrollment.enrolledAt.getTime() - a.enrollment.enrolledAt.getTime()).map(({ enrollment, user, course }) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.displayName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{course.title}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-12 text-right">{enrollment.progress}%</span>
                      <Progress value={enrollment.progress} className="w-24" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                      {enrollment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Intl.DateTimeFormat('en-US').format(enrollment.enrolledAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No student enrollment data found for your courses yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentProgressPage;