'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { OBSERVATION_CONSTANTS, OBSERVATION_MESSAGES } from '@/lib/constants/observations';
import type { Observation } from '@/lib/db/schema/observations';

interface ObservationFormProps {
  studentId: string;
  teacherId: number;
  existingObservation?: Observation;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ObservationForm({
  studentId,
  teacherId,
  existingObservation,
  onSuccess,
  onCancel,
}: ObservationFormProps) {
  const [note, setNote] = useState(existingObservation?.note || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate note length
    if (note.trim().length < OBSERVATION_CONSTANTS.MIN_NOTE_LENGTH) {
      setError(OBSERVATION_MESSAGES.NOTE_TOO_SHORT);
      return;
    }

    if (note.length > OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH) {
      setError(OBSERVATION_MESSAGES.NOTE_TOO_LONG);
      return;
    }

    setIsLoading(true);

    try {
      if (existingObservation) {
        // Update existing observation
        const response = await fetch(
          `/api/teacher/observations/${existingObservation.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ note: note.trim() }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update observation');
        }
      } else {
        // Create new observation
        const response = await fetch(
          `/api/teacher/students/${studentId}/observations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ note: note.trim() }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create observation');
        }
      }

      // Success
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const characterCount = note.length;
  const isNearLimit = characterCount > OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH * 0.9;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="note">Observation Note</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Describe what you observed about the student's progress, behavior, or activities..."
          className="min-h-[150px] resize-y"
          disabled={isLoading}
          maxLength={OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Minimum {OBSERVATION_CONSTANTS.MIN_NOTE_LENGTH} character</span>
          <span className={isNearLimit ? 'text-orange-600 font-medium' : ''}>
            {characterCount} / {OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH}
          </span>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingObservation ? 'Update' : 'Create'} Observation
        </Button>
      </div>
    </form>
  );
}
