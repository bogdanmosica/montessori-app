'use client';

/**
 * Validation Summary Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportValidationResult } from '@/lib/types/import-types';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ValidationSummaryProps {
  result: ImportValidationResult;
}

export default function ValidationSummary({ result }: ValidationSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validation Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Valid Rows</p>
              <p className="text-2xl font-bold">{result.validCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Errors</p>
              <p className="text-2xl font-bold">{result.errorCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Rows</p>
              <p className="text-2xl font-bold">{result.totalRows}</p>
            </div>
          </div>
        </div>

        {result.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Errors Found:</h4>
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {result.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertDescription>
                    Row {error.row}, Field "{error.field}": {error.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
