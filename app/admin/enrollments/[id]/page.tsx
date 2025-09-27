import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import AdminNavigation from '@/components/admin/admin-navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  FileText,
  Clock,
  Edit,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { EnrollmentService } from '@/lib/services/enrollment-service';
import type { EnrollmentWithChild } from '@/app/admin/enrollments/types';
import { ENROLLMENT_STATUS } from '@/app/admin/enrollments/constants';

interface EnrollmentDetailsProps {
  params: Promise<{ id: string }>;
}

// Component to fetch and display enrollment details
async function EnrollmentDetailsContent({ enrollmentId }: { enrollmentId: string }) {
  const session = await auth();
  
  if (!session?.user) {
    return redirect('/sign-in');
  }

  requireAdminPermissions(session.user.role);

  if (!session?.user?.teamId) {
    return notFound();
  }

  const schoolId = session.user.teamId;

  try {
    const enrollment = await EnrollmentService.getEnrollmentById(enrollmentId, schoolId);
    
    if (!enrollment) {
      return notFound();
    }

    return <EnrollmentDetailsDisplay enrollment={enrollment} />;
  } catch (error) {
    console.error('Error fetching enrollment details:', error);
    return notFound();
  }
}

// Component to display enrollment details
function EnrollmentDetailsDisplay({ enrollment }: { enrollment: EnrollmentWithChild }) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'withdrawn':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
        return <AlertCircle className="h-4 w-4" />;
      case 'withdrawn':
        return <XCircle className="h-4 w-4" />;
      case 'archived':
        return <FileText className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/enrollments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Enrollments
              </Button>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Enrollment Details
              </h1>
              <p className="text-gray-600">
                {enrollment.child.firstName} {enrollment.child.lastName}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={`px-3 py-1 font-medium ${getStatusColor(enrollment.status)}`}
              >
                {getStatusIcon(enrollment.status)}
                <span className="ml-2 capitalize">{enrollment.status}</span>
              </Badge>
              
              <Link href={`/admin/enrollments/${enrollment.id}/edit`}>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Enrollment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-lg font-semibold">
                      {enrollment.child.firstName} {enrollment.child.lastName}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-lg">
                      {formatDate(enrollment.child.dateOfBirth)} 
                      <span className="text-gray-500 ml-2">
                        (Age: {calculateAge(enrollment.child.dateOfBirth)})
                      </span>
                    </p>
                  </div>
                </div>
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg">
                      {enrollment.child.parentName || 'Not available'}
                    </p>
                  </div>
                  
                  {enrollment.child.parentEmail && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-lg flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`mailto:${enrollment.child.parentEmail}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {enrollment.child.parentEmail}
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {enrollment.child.parentPhone && (
                    <div className="md:col-span-1">
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-lg flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a 
                          href={`tel:${enrollment.child.parentPhone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {enrollment.child.parentPhone}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {enrollment.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {enrollment.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Enrollment Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 font-medium ${getStatusColor(enrollment.status)}`}
                    >
                      {getStatusIcon(enrollment.status)}
                      <span className="ml-2 capitalize">{enrollment.status}</span>
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Enrollment Date</label>
                  <p className="text-lg flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatDate(enrollment.enrollmentDate)}
                  </p>
                </div>
                
                {enrollment.withdrawalDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Withdrawal Date</label>
                    <p className="text-lg flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-red-400" />
                      {formatDate(enrollment.withdrawalDate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Record Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Record Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {formatDate(enrollment.createdAt)}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-sm text-gray-700 mt-1">
                    {formatDate(enrollment.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/admin/enrollments/${enrollment.id}/edit`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Enrollment
                  </Button>
                </Link>
                
                <Link href={`/admin/children/${enrollment.child.id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    View Child Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component
function EnrollmentDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-96 mb-8"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default async function EnrollmentDetailsPage({ params }: EnrollmentDetailsProps) {
  const { id: enrollmentId } = await params;

  return (
    <Suspense fallback={<EnrollmentDetailsLoading />}>
      <EnrollmentDetailsContent enrollmentId={enrollmentId} />
    </Suspense>
  );
}