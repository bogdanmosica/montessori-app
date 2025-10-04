import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

interface TeacherStatusBadgeProps {
  isActive: boolean;
}

export function TeacherStatusBadge({ isActive }: TeacherStatusBadgeProps) {
  if (isActive) {
    return (
      <Badge variant="default" className="bg-green-500">
        <Check className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-gray-400">
      <X className="h-3 w-3 mr-1" />
      Inactive
    </Badge>
  );
}
