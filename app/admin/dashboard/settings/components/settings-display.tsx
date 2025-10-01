import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Clock, Building2 } from 'lucide-react';

interface SettingsDisplayProps {
  defaultMonthlyFee: number;
  freeEnrollmentCount: number;
  maximumCapacity: number;
  lastUpdated: Date | null;
}

/**
 * Settings Display Component - Server Component
 * Displays current school settings in a read-only format
 */
export function SettingsDisplay({
  defaultMonthlyFee,
  freeEnrollmentCount,
  maximumCapacity,
  lastUpdated,
}: SettingsDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Default Monthly Fee */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Default Monthly Fee</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{defaultMonthlyFee.toFixed(2)} RON</div>
          <p className="text-xs text-muted-foreground mt-1">
            Applied to new child enrollments by default
          </p>
        </CardContent>
      </Card>

      {/* Free Enrollment Count */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Free Enrollment Quota</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{freeEnrollmentCount}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Number of free enrollments available school-wide
          </p>
        </CardContent>
      </Card>

      {/* Maximum Capacity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Maximum Capacity</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{maximumCapacity}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Total student capacity for the school
          </p>
        </CardContent>
      </Card>

      {/* Last Updated */}
      {lastUpdated && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {new Date(lastUpdated).toLocaleDateString()} at{' '}
                {new Date(lastUpdated).toLocaleTimeString()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Settings were last modified on this date
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}