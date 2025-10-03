import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Activity } from 'lucide-react';

interface StudentProfileProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    age: number;
    enrollmentStatus: string;
    startDate: Date;
    gender: string | null;
    specialNeeds: string | null;
    medicalConditions: string | null;
  };
}

export function StudentProfile({ student }: StudentProfileProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>Student demographics and enrollment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Full Name</p>
            <p className="text-lg font-semibold">
              {student.firstName} {student.lastName}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Age</p>
              <p className="text-base">{student.age} years</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="text-base">{student.gender || 'Not specified'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
            <p className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(student.dateOfBirth).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Enrollment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Enrollment Status
          </CardTitle>
          <CardDescription>Current enrollment and start date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge
              variant={student.enrollmentStatus === 'ACTIVE' ? 'default' : 'secondary'}
              className="mt-1"
            >
              {student.enrollmentStatus}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Start Date</p>
            <p className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {new Date(student.startDate).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Special Needs & Medical Info */}
      {(student.specialNeeds || student.medicalConditions) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Special Considerations</CardTitle>
            <CardDescription>Important notes for student care</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {student.specialNeeds && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Special Needs</p>
                <p className="text-base mt-1">{student.specialNeeds}</p>
              </div>
            )}
            {student.medicalConditions && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medical Conditions</p>
                <p className="text-base mt-1">{student.medicalConditions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
