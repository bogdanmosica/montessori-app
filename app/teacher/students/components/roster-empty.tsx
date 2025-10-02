import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserX } from 'lucide-react';

export default function RosterEmpty() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UserX className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>Student Roster Empty</CardTitle>
        <CardDescription>
          Your student roster is currently empty.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>Students will appear here once they are assigned to you by the administrator.</p>
      </CardContent>
    </Card>
  );
}
