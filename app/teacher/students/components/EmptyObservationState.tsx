import { FileText } from 'lucide-react';

export function EmptyObservationState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-3 mb-4">
        <FileText className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No observations yet</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Start tracking this student's progress by adding your first observation above.
      </p>
    </div>
  );
}
