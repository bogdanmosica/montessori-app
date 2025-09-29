import { Badge } from '@/components/ui/badge';
import { ApplicationStatus, APPLICATION_STATUS_LABELS } from '@/lib/constants/application-status';
import { CheckCircle, Clock, XCircle, GraduationCap, Pause, Users } from 'lucide-react';

interface ApplicationStatusBadgeProps {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'INACTIVE' | 'WAITLISTED';
  showIcon?: boolean;
}

export function ApplicationStatusBadge({ status, showIcon = true }: ApplicationStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case ApplicationStatus.PENDING:
        return {
          variant: 'secondary' as const,
          icon: Clock,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        };
      case ApplicationStatus.APPROVED:
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
        };
      case ApplicationStatus.REJECTED:
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
        };
      case 'ACTIVE':
        return {
          variant: 'default' as const,
          icon: GraduationCap,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
        };
      case 'INACTIVE':
        return {
          variant: 'secondary' as const,
          icon: Pause,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        };
      case 'WAITLISTED':
        return {
          variant: 'outline' as const,
          icon: Users,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
        };
      default:
        return {
          variant: 'secondary' as const,
          icon: Clock,
          className: '',
        };
    }
  };

  const getStatusLabel = (status: string) => {
    const appStatusLabel = APPLICATION_STATUS_LABELS[status as keyof typeof APPLICATION_STATUS_LABELS];
    if (appStatusLabel) return appStatusLabel;
    
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'INACTIVE':
        return 'Inactive';
      case 'WAITLISTED':
        return 'Waitlisted';
      default:
        return status;
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  const label = getStatusLabel(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {showIcon && <Icon className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  );
}