import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApplicationStatusBadge } from './application-status-badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Mail, Phone, FileText, AlertCircle, Heart } from 'lucide-react';
import { format } from 'date-fns';

interface ApplicationDetailProps {
  application: {
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    child_first_name: string;
    child_last_name: string;
    child_date_of_birth: string;
    child_gender: string | null;
    preferred_start_date: string;
    special_needs: string | null;
    medical_conditions: string | null;
    parent1_first_name: string;
    parent1_last_name: string;
    parent1_email: string;
    parent1_phone: string | null;
    parent1_relationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER';
    parent2_first_name: string | null;
    parent2_last_name: string | null;
    parent2_email: string | null;
    parent2_phone: string | null;
    parent2_relationship: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER' | null;
    submitted_at: string;
    processed_at: string | null;
    processed_by_admin_id: string | null;
  };
}

export function ApplicationDetail({ application }: ApplicationDetailProps) {
  const childAge = Math.floor(
    (Date.now() - new Date(application.child_date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      {/* Application Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Application Status</CardTitle>
            <ApplicationStatusBadge status={application.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Submitted:</span>
              <p className="font-medium">
                {format(new Date(application.submitted_at), 'PPP')}
              </p>
            </div>
            {application.processed_at && (
              <div>
                <span className="text-muted-foreground">Processed:</span>
                <p className="font-medium">
                  {format(new Date(application.processed_at), 'PPP')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Child Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Child Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Full Name</span>
              <p className="font-medium">
                {application.child_first_name} {application.child_last_name}
              </p>
            </div>

            <div>
              <span className="text-sm text-muted-foreground">Date of Birth</span>
              <p className="font-medium">
                {format(new Date(application.child_date_of_birth), 'PPP')} (Age: {childAge})
              </p>
            </div>

            {application.child_gender && (
              <div>
                <span className="text-sm text-muted-foreground">Gender</span>
                <p className="font-medium">{application.child_gender}</p>
              </div>
            )}

            <div>
              <span className="text-sm text-muted-foreground">Preferred Start Date</span>
              <p className="font-medium">
                {format(new Date(application.preferred_start_date), 'PPP')}
              </p>
            </div>
          </div>

          {(application.special_needs || application.medical_conditions) && (
            <>
              <Separator />
              <div className="space-y-3">
                {application.special_needs && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">Special Needs</span>
                    </div>
                    <p className="text-sm bg-blue-50 p-3 rounded-md">
                      {application.special_needs}
                    </p>
                  </div>
                )}

                {application.medical_conditions && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-red-700">Medical Conditions</span>
                    </div>
                    <p className="text-sm bg-red-50 p-3 rounded-md">
                      {application.medical_conditions}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Parent Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Parent/Guardian Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Parent */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Primary Contact</Badge>
              <span className="text-sm text-muted-foreground">
                {application.parent1_relationship}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Full Name</span>
                <p className="font-medium">
                  {application.parent1_first_name} {application.parent1_last_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Email</span>
                  <p className="font-medium">{application.parent1_email}</p>
                </div>
              </div>

              {application.parent1_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <p className="font-medium">{application.parent1_phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Parent */}
          {application.parent2_first_name && application.parent2_email && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Secondary Contact</Badge>
                  <span className="text-sm text-muted-foreground">
                    {application.parent2_relationship}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Full Name</span>
                    <p className="font-medium">
                      {application.parent2_first_name} {application.parent2_last_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-sm text-muted-foreground">Email</span>
                      <p className="font-medium">{application.parent2_email}</p>
                    </div>
                  </div>

                  {application.parent2_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <p className="font-medium">{application.parent2_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}