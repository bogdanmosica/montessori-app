import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

/**
 * Empty State (Server Component)
 *
 * Displayed when teacher has no assigned students.
 */
export default function EmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Students Assigned</CardTitle>
        <CardDescription>
          You don't have any students assigned to your class yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Users className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground max-w-md">
          Once students are enrolled in your class, you'll be able to record their daily attendance here.
          Contact your school administrator for assistance with student assignments.
        </p>
      </CardContent>
    </Card>
  );
}
