'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit2, Clock } from 'lucide-react';
import { ObservationFormDialog } from './ObservationFormDialog';
import type { Observation } from '@/lib/db/schema/observations';
import { formatDistanceToNow } from 'date-fns';

interface ObservationCardProps {
  observation: Observation;
  studentId: string;
  teacherId: number;
}

export function ObservationCard({
  observation,
  studentId,
  teacherId,
}: ObservationCardProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(observation.createdAt), { addSuffix: true })}
              {observation.updatedAt !== observation.createdAt && ' (edited)'}
            </p>
          </div>
          <ObservationFormDialog
            studentId={studentId}
            teacherId={teacherId}
            existingObservation={observation}
          >
            <Button variant="ghost" size="sm">
              <Edit2 className="h-4 w-4" />
            </Button>
          </ObservationFormDialog>
        </div>
        <p className="text-base leading-relaxed">{observation.note}</p>
      </div>
    </Card>
  );
}
