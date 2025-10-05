'use client';

/**
 * Review and Confirmation Component
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EntityType } from '@/lib/constants/import-constants';
import { Check } from 'lucide-react';

interface ReviewConfirmProps {
  entityType: EntityType;
  validRows: any[];
  onSuccess: () => void;
}

export default function ReviewConfirm({
  entityType,
  validRows,
  onSuccess,
}: ReviewConfirmProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      const response = await fetch('/admin/import/api/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType,
          validRows,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setSuccess(true);
      setResult(data);

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsConfirming(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Check className="h-5 w-5" />
            Import Successful
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">
            Imported {result?.importedCount || 0} records successfully.
            {result?.skippedCount > 0 && ` Skipped ${result.skippedCount} duplicate records.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm Import</CardTitle>
        <CardDescription>
          Review the valid records and confirm to import them into the system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            Ready to import {validRows.length} valid record{validRows.length !== 1 ? 's' : ''}.
          </p>
          <p className="mt-1 text-xs text-blue-600">
            Duplicate records will be skipped automatically.
          </p>
        </div>

        <Button onClick={handleConfirm} disabled={isConfirming} className="w-full">
          {isConfirming ? 'Importing...' : 'Confirm and Import'}
        </Button>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
