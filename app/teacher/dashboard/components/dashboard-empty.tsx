import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function DashboardEmpty() {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle>No Students Assigned</CardTitle>
        <CardDescription>
          You don&apos;t have any students assigned to you yet.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-muted-foreground">
        <p>Contact your administrator to get students assigned to your class.</p>
      </CardContent>
    </Card>
  );
}
