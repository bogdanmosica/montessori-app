import { Suspense } from 'react';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';
import { db } from '@/lib/db';
import { children, parentProfiles, parentChildRelationships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import AdminNavigation from '@/components/admin/admin-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, UserPlus, Users, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { AddParentForm } from './components/add-parent-form';
import { ParentCard } from './components/parent-card';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ManageParentsPage({ params }: PageProps) {
  const { id: childId } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect('/unauthorized');
  }

  const schoolId = session.user.teamId;
  if (!schoolId) {
    redirect('/unauthorized');
  }

  // Get child details
  const [child] = await db
    .select()
    .from(children)
    .where(
      and(
        eq(children.id, childId),
        eq(children.schoolId, schoolId)
      )
    )
    .limit(1);

  if (!child) {
    redirect('/admin/applications');
  }

  // Get existing parent relationships
  const parentRelationships = await db
    .select({
      relationship: parentChildRelationships,
      parent: parentProfiles,
    })
    .from(parentChildRelationships)
    .innerJoin(parentProfiles, eq(parentProfiles.id, parentChildRelationships.parentId))
    .where(eq(parentChildRelationships.childId, childId))
    .orderBy(parentChildRelationships.primaryContact);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href={`/admin/children/${childId}`}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Parents</h1>
                <p className="text-muted-foreground">
                  {child.firstName} {child.lastName}
                </p>
              </div>
            </div>
          </div>

          {/* Existing Parents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Current Parents ({parentRelationships.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {parentRelationships.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No parents linked yet</p>
                  <p className="text-sm mt-2">Add a parent below to get started</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {parentRelationships.map(({ relationship, parent }) => (
                    <ParentCard
                      key={relationship.id}
                      parent={parent}
                      relationship={relationship}
                      childId={childId}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add New Parent */}
          {parentRelationships.length < 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Add Parent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AddParentForm
                  childId={childId}
                  schoolId={schoolId}
                  hasExistingParents={parentRelationships.length > 0}
                />
              </CardContent>
            </Card>
          )}

          {parentRelationships.length >= 2 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="pt-6">
                <p className="text-sm text-amber-800">
                  Maximum of 2 parents per child. Remove an existing parent to add a new one.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
