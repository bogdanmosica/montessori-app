// T023: Create EmptyState server component
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  UserPlus,
  FileText,
  TrendingUp,
  School,
  ArrowRight,
  Lightbulb
} from 'lucide-react';
import { EMPTY_STATE_MESSAGES } from '../constants';
import Link from 'next/link';

type EmptyStateType =
  | 'applications'
  | 'enrollments'
  | 'trends'
  | 'families'
  | 'new_school'
  | 'established_school';

interface EmptyStateProps {
  type: EmptyStateType;
  schoolAge?: 'new' | 'established';
  className?: string;
}

export default function EmptyState({ type, schoolAge, className }: EmptyStateProps) {
  const getEmptyStateContent = (stateType: EmptyStateType) => {
    switch (stateType) {
      case 'applications':
        return {
          icon: <UserPlus className="h-12 w-12 text-blue-500" />,
          title: 'No Pending Applications',
          message: EMPTY_STATE_MESSAGES.NO_APPLICATIONS,
          description: 'When families submit applications, they will appear here for review.',
          actions: [
            {
              label: 'Set Up Application Process',
              href: '/admin/settings/applications',
              variant: 'default' as const
            },
            {
              label: 'View Application Settings',
              href: '/admin/settings',
              variant: 'outline' as const
            }
          ]
        };

      case 'enrollments':
        return {
          icon: <Users className="h-12 w-12 text-green-500" />,
          title: 'No Active Enrollments',
          message: EMPTY_STATE_MESSAGES.NO_ENROLLMENTS,
          description: 'Start by reviewing applications and enrolling your first students.',
          actions: [
            {
              label: 'Review Applications',
              href: '/admin/applications',
              variant: 'default' as const
            },
            {
              label: 'Add Student Manually',
              href: '/admin/students/new',
              variant: 'outline' as const
            }
          ]
        };

      case 'trends':
        return {
          icon: <TrendingUp className="h-12 w-12 text-purple-500" />,
          title: 'Building Your Data',
          message: EMPTY_STATE_MESSAGES.NO_TRENDS_DATA,
          description: 'Trends will appear once you have at least a week of enrollment and activity data.',
          actions: [
            {
              label: 'View Current Metrics',
              href: '/admin/dashboard',
              variant: 'default' as const
            }
          ]
        };

      case 'families':
        return {
          icon: <FileText className="h-12 w-12 text-orange-500" />,
          title: 'No Families Enrolled',
          message: EMPTY_STATE_MESSAGES.NO_FAMILIES,
          description: 'Once families enroll their children, family information and billing will appear here.',
          actions: [
            {
              label: 'Process Applications',
              href: '/admin/applications',
              variant: 'default' as const
            },
            {
              label: 'Set Up Billing',
              href: '/admin/settings/billing',
              variant: 'outline' as const
            }
          ]
        };

      case 'new_school':
        return {
          icon: <School className="h-12 w-12 text-blue-600" />,
          title: 'Welcome to Monte SMS!',
          message: 'Let\'s get your school set up for success.',
          description: 'Follow these steps to start managing your Montessori school effectively.',
          actions: [
            {
              label: 'Complete School Setup',
              href: '/admin/onboarding',
              variant: 'default' as const
            },
            {
              label: 'Import Student Data',
              href: '/admin/import',
              variant: 'outline' as const
            }
          ],
          checklist: [
            { label: 'Set up school information', completed: false },
            { label: 'Configure age groups and capacity', completed: false },
            { label: 'Set up fee structure', completed: false },
            { label: 'Invite teachers to join', completed: false },
            { label: 'Create application process', completed: false }
          ]
        };

      case 'established_school':
        return {
          icon: <TrendingUp className="h-12 w-12 text-gray-500" />,
          title: 'No Recent Data',
          message: 'Your dashboard will populate as activity occurs.',
          description: 'Recent applications, enrollments, and teacher activity will appear here.',
          actions: [
            {
              label: 'Check System Status',
              href: '/admin/system-status',
              variant: 'default' as const
            },
            {
              label: 'View Historical Data',
              href: '/admin/reports',
              variant: 'outline' as const
            }
          ]
        };

      default:
        return {
          icon: <FileText className="h-12 w-12 text-gray-500" />,
          title: 'No Data Available',
          message: 'Data will appear here when available.',
          description: 'Check back later or contact support if you expect to see data here.',
          actions: []
        };
    }
  };

  const content = getEmptyStateContent(type);

  return (
    <Card data-testid={`empty-state-${type}`} className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center text-center p-8 py-12">
        {/* Icon */}
        <div className="mb-4">
          {content.icon}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {content.title}
        </h3>

        {/* Message */}
        <p className="text-sm text-muted-foreground mb-2">
          {content.message}
        </p>

        {/* Description */}
        {content.description && (
          <p className="text-xs text-muted-foreground mb-6 max-w-sm">
            {content.description}
          </p>
        )}

        {/* Checklist for new schools */}
        {content.checklist && (
          <div className="w-full max-w-sm mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Lightbulb className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-900">Getting Started</span>
              </div>
              <ul className="space-y-2 text-left">
                {content.checklist.map((item, index) => (
                  <li key={index} className="flex items-center text-xs text-blue-800">
                    <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${
                      item.completed
                        ? 'bg-green-500'
                        : 'bg-gray-300 border-2 border-blue-300'
                    }`}>
                      {item.completed && (
                        <div className="w-full h-full flex items-center justify-center">
                          ✓
                        </div>
                      )}
                    </div>
                    <span className={item.completed ? 'line-through' : ''}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        {content.actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            {content.actions.map((action, index) => (
              <Button
                key={index}
                asChild
                variant={action.variant}
                size="sm"
                className="flex-1"
              >
                <Link href={action.href}>
                  {action.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        )}

        {/* Additional Help */}
        {type === 'new_school' && (
          <div className="mt-6 pt-6 border-t border-gray-200 w-full max-w-sm">
            <p className="text-xs text-muted-foreground mb-3">
              Need help getting started?
            </p>
            <div className="flex justify-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/help">
                  Help Center
                </Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/support">
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Data explanation for trends */}
        {type === 'trends' && (
          <div data-testid="trends-explanation" className="mt-4 text-xs text-muted-foreground max-w-sm">
            <p>
              Trends require at least one week of data to display meaningful insights.
              Continue using the system and check back in a few days.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}