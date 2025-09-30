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
  MapPin,
  Heart,
  AlertTriangle,
  Users,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db/drizzle';
import { children, parentProfiles, parentChildRelationships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { FeeDisplay } from '@/components/ui/fee-display';

interface ChildDetailsProps {
  params: Promise<{ id: string }>;
}

// Child with parent relationships type
interface ChildWithParents {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender?: string;
  enrollmentStatus: string;
  startDate: Date;
  specialNeeds?: string;
  medicalConditions?: string;
  monthlyFee: number;
  createdAt: Date;
  parents: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    relationshipType: string;
    primaryContact: boolean;
    pickupAuthorized: boolean;
  }>;
}

async function getChildWithParents(childId: string, schoolId: number): Promise<ChildWithParents | null> {
  try {
    // Get child details
    const childResults = await db
      .select()
      .from(children)
      .where(and(
        eq(children.id, childId),
        eq(children.schoolId, schoolId)
      ))
      .limit(1);

    if (childResults.length === 0) {
      return null;
    }

    const child = childResults[0];

    // Get parent relationships
    const parentResults = await db
      .select({
        id: parentProfiles.id,
        firstName: parentProfiles.firstName,
        lastName: parentProfiles.lastName,
        email: parentProfiles.email,
        phone: parentProfiles.phone,
        address: parentProfiles.address,
        relationshipType: parentChildRelationships.relationshipType,
        primaryContact: parentChildRelationships.primaryContact,
        pickupAuthorized: parentChildRelationships.pickupAuthorized,
      })
      .from(parentChildRelationships)
      .innerJoin(parentProfiles, eq(parentProfiles.id, parentChildRelationships.parentId))
      .where(eq(parentChildRelationships.childId, childId));

    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      gender: child.gender,
      enrollmentStatus: child.enrollmentStatus,
      startDate: child.startDate,
      specialNeeds: child.specialNeeds,
      medicalConditions: child.medicalConditions,
      monthlyFee: child.monthlyFee,
      createdAt: child.createdAt,
      parents: parentResults,
    };
  } catch (error) {
    console.error('Error fetching child details:', error);
    return null;
  }
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800';
    case 'waitlisted':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

async function ChildDetailsContent({ params }: ChildDetailsProps) {
  // Auth check
  const session = await auth();
  if (!session?.user) {
    redirect('/sign-in');
  }

  try {
    requireAdminPermissions(session.user.role);
  } catch {
    redirect('/unauthorized');
  }

  const schoolId = session.user.teamId;
  if (!schoolId) {
    throw new Error('School not found in session');
  }

  const resolvedParams = await params;
  const childId = resolvedParams.id;

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(childId)) {
    notFound();
  }

  const childWithParents = await getChildWithParents(childId, schoolId);

  if (!childWithParents) {
    notFound();
  }

  const age = calculateAge(childWithParents.dateOfBirth);
  const primaryParent = childWithParents.parents.find(p => p.primaryContact);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/applications">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {childWithParents.firstName} {childWithParents.lastName}
            </h1>
            <p className="text-gray-500 mt-1">
              Student Profile • Age {age}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(childWithParents.enrollmentStatus)}>
            {childWithParents.enrollmentStatus}
          </Badge>
          <Button size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Child Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">First Name</label>
                  <p className="text-gray-900 font-medium">{childWithParents.firstName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Name</label>
                  <p className="text-gray-900 font-medium">{childWithParents.lastName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                  <p className="text-gray-900 font-medium">
                    {childWithParents.dateOfBirth.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} (Age {age})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Gender</label>
                  <p className="text-gray-900 font-medium">{childWithParents.gender || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900 font-medium">
                    {childWithParents.startDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monthly Fee</label>
                  <p className="text-gray-900 font-medium">
                    <FeeDisplay feeCents={childWithParents.monthlyFee} format="default" />
                  </p>
                </div>
              </div>

              {/* Special Needs */}
              {childWithParents.specialNeeds && (
                <div className="border-t pt-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Special Needs</label>
                      <p className="text-gray-900">{childWithParents.specialNeeds}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Medical Conditions */}
              {childWithParents.medicalConditions && (
                <div className={childWithParents.specialNeeds ? '' : 'border-t pt-4'}>
                  <div className="flex items-start gap-2">
                    <Heart className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Medical Conditions</label>
                      <p className="text-gray-900">{childWithParents.medicalConditions}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parent/Guardian Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parent/Guardian Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {childWithParents.parents.length === 0 ? (
                <p className="text-gray-500 italic">No parent information available</p>
              ) : (
                <div className="space-y-6">
                  {childWithParents.parents.map((parent, index) => (
                    <div key={parent.id} className={index > 0 ? 'border-t pt-6' : ''}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {parent.firstName} {parent.lastName}
                          </h3>
                          <Badge variant="secondary">{parent.relationshipType}</Badge>
                          {parent.primaryContact && (
                            <Badge variant="default">Primary Contact</Badge>
                          )}
                        </div>
                        {parent.pickupAuthorized && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Pickup Authorized
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <div>
                            <label className="text-xs text-gray-500">Email</label>
                            <p className="text-sm text-gray-900">{parent.email}</p>
                          </div>
                        </div>
                        
                        {parent.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <div>
                              <label className="text-xs text-gray-500">Phone</label>
                              <p className="text-sm text-gray-900">{parent.phone}</p>
                            </div>
                          </div>
                        )}
                        
                        {parent.address && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <div>
                              <label className="text-xs text-gray-500">Address</label>
                              <p className="text-sm text-gray-900">{parent.address}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Enrollment Status</span>
                <Badge className={getStatusColor(childWithParents.enrollmentStatus)}>
                  {childWithParents.enrollmentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Age</span>
                <span className="text-sm font-medium">{age} years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Monthly Fee</span>
                <span className="text-sm font-medium">{formatCurrency(childWithParents.monthlyFee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Primary Contact</span>
                <span className="text-sm font-medium">
                  {primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}` : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" className="w-full" size="sm" asChild>
                <Link href={`/admin/enrollments/new?childId=${childWithParents.id}`}>
                  Add Enrollment
                </Link>
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                View Enrollments
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Contact Parents
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
        <div>
          <div className="w-48 h-8 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function ChildDetailsPage(props: ChildDetailsProps) {
  return (
    <>
      <AdminNavigation />
      <div className="min-h-screen bg-gray-50/30">
        <div className="container mx-auto px-4 py-8">
          <Suspense fallback={<LoadingSkeleton />}>
            <ChildDetailsContent {...props} />
          </Suspense>
        </div>
      </div>
    </>
  );
}