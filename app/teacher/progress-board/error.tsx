'use client';

/**
 * Error Boundary for Progress Board
 */

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Progress Board Error:', error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
            <h2 className="mt-4 text-xl font-semibold text-red-900">
              Something went wrong!
            </h2>
            <p className="mt-2 text-red-700">
              {error.message || 'An error occurred while loading the progress board.'}
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={() => reset()} variant="outline">
                Try again
              </Button>
              <Button onClick={() => window.location.href = '/teacher/dashboard'}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
    </div>
  );
}
