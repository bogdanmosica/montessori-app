import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';
import { ObservationCard } from './ObservationCard';
import { EmptyObservationState } from './EmptyObservationState';
import { ObservationFormDialog } from './ObservationFormDialog';
import type { Observation } from '@/lib/db/schema/observations';

interface ObservationListProps {
  studentId: string;
  teacherId: number;
  initialObservations: Observation[];
}

export function ObservationList({
  studentId,
  teacherId,
  initialObservations,
}: ObservationListProps) {
  const hasObservations = initialObservations.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Observations
            </CardTitle>
            <CardDescription>
              Track student progress and activities
            </CardDescription>
          </div>
          <ObservationFormDialog studentId={studentId} teacherId={teacherId}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Observation
            </Button>
          </ObservationFormDialog>
        </div>
      </CardHeader>
      <CardContent>
        {hasObservations ? (
          <div className="space-y-4">
            {initialObservations.map((observation) => (
              <ObservationCard
                key={observation.id}
                observation={observation}
                studentId={studentId}
                teacherId={teacherId}
              />
            ))}
            {initialObservations.length >= 5 && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing recent observations. View student profile for complete history.
                </p>
              </div>
            )}
          </div>
        ) : (
          <EmptyObservationState />
        )}
      </CardContent>
    </Card>
  );
}
