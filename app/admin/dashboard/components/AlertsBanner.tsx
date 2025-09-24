// T022: Create AlertsBanner server component
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Shield,
  Clock,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import type { SecurityAlert, AlertSeverity } from '@/lib/types/dashboard';
import { EMPTY_STATE_MESSAGES } from '../constants';
import Link from 'next/link';

interface AlertsBannerProps {
  alerts: SecurityAlert[];
  className?: string;
}

export default function AlertsBanner({ alerts, className }: AlertsBannerProps) {
  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColors = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-800'
        };
      case 'high':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-800'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-800'
        };
      case 'low':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800'
        };
      default:
        return {
          bg: 'bg-gray-50 border-gray-200',
          text: 'text-gray-900',
          badge: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const priorityAlerts = alerts
    .sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    })
    .slice(0, 5); // Show only top 5 alerts

  // Empty state
  if (alerts.length === 0) {
    return (
      <Card data-testid="alerts-banner" className={`${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">
              {EMPTY_STATE_MESSAGES.NO_SECURITY_ALERTS}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div data-testid="alerts-banner" className={`space-y-3 ${className}`}>
      {/* High Priority Alerts Header */}
      {priorityAlerts.some(alert => ['critical', 'high'].includes(alert.severity)) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">Security Alerts Require Attention</span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/security">
                View All Alerts
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Individual Alerts */}
      <div className="space-y-2">
        {priorityAlerts.map((alert, index) => {
          const colors = getSeverityColors(alert.severity);

          return (
            <Card
              key={alert.id}
              className={`${colors.bg} border transition-all hover:shadow-md`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={colors.badge}>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className={`text-sm font-medium ${colors.text}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimestamp(alert.timestamp)}</span>
                        </div>
                        {alert.metadata?.ipAddress && (
                          <span>IP: {alert.metadata.ipAddress}</span>
                        )}
                        {alert.metadata?.attempts && (
                          <span>{alert.metadata.attempts} attempts</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/security/alerts/${alert.id}`}>
                        Details
                        <ChevronRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Alert Metadata */}
                {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-current/10">
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                        View Details
                      </summary>
                      <div className="mt-2 text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap text-xs">
                          {JSON.stringify(alert.metadata, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Show More Link */}
      {alerts.length > 5 && (
        <div className="text-center">
          <Button asChild variant="link">
            <Link href="/admin/security">
              View {alerts.length - 5} more alerts
            </Link>
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Security Center</span>
            </div>
            <div className="flex space-x-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/security/settings">
                  Settings
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/security/logs">
                  Activity Logs
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}