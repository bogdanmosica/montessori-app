// T027: Create SystemHealthCard server component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Server,
  Zap,
  AlertTriangle,
  CheckCircle,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';
import type { AggregatedMetrics } from '@/lib/types/dashboard';
import Link from 'next/link';

interface SystemHealthCardProps {
  systemMetrics: AggregatedMetrics;
  className?: string;
}

export default function SystemHealthCard({ systemMetrics, className }: SystemHealthCardProps) {
  const { systemHealth, securitySummary } = systemMetrics;

  const getHealthStatus = (uptime: number) => {
    if (uptime >= 99.5) return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (uptime >= 99.0) return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (uptime >= 95.0) return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { status: 'critical', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const getResponseTimeStatus = (responseTime: number) => {
    if (responseTime <= 200) return { status: 'excellent', color: 'text-green-600' };
    if (responseTime <= 300) return { status: 'good', color: 'text-blue-600' };
    if (responseTime <= 500) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  const getErrorRateStatus = (errorRate: number) => {
    if (errorRate <= 0.1) return { status: 'excellent', color: 'text-green-600' };
    if (errorRate <= 0.5) return { status: 'good', color: 'text-blue-600' };
    if (errorRate <= 1.0) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'critical', color: 'text-red-600' };
  };

  const healthStatus = getHealthStatus(systemHealth.uptime);
  const responseStatus = getResponseTimeStatus(systemHealth.avgResponseTime);
  const errorStatus = getErrorRateStatus(systemHealth.errorRate);

  const totalSecurityAlerts = Object.values(securitySummary).reduce((sum, count) => sum + count, 0);
  const criticalAlerts = securitySummary.critical + securitySummary.high;

  return (
    <Card data-testid="system-health-card" className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            System Health Overview
          </div>
          <Badge
            variant={healthStatus.status === 'excellent' ? 'default' : healthStatus.status === 'critical' ? 'destructive' : 'secondary'}
            className={healthStatus.color}
          >
            {healthStatus.status.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall System Status */}
        <div className={`p-4 rounded-lg ${healthStatus.bg} border`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {healthStatus.status === 'excellent' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className={`h-5 w-5 ${healthStatus.color}`} />
              )}
              <span className={`font-medium ${healthStatus.color}`}>
                System Status: {healthStatus.status === 'excellent' ? 'All Systems Operational' : 'Monitoring Required'}
              </span>
            </div>
            <span className={`text-2xl font-bold ${healthStatus.color}`}>
              {systemHealth.uptime.toFixed(2)}%
            </span>
          </div>
          <Progress value={systemHealth.uptime} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            System uptime over the last 30 days
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Response Time */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <div className={`text-2xl font-bold ${responseStatus.color}`}>
              {systemHealth.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground">Avg Response Time</p>
            <Badge
              variant="outline"
              className={`mt-1 ${responseStatus.color}`}
            >
              {responseStatus.status}
            </Badge>
          </div>

          {/* Error Rate */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div className={`text-2xl font-bold ${errorStatus.color}`}>
              {systemHealth.errorRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Error Rate</p>
            <Badge
              variant="outline"
              className={`mt-1 ${errorStatus.color}`}
            >
              {errorStatus.status}
            </Badge>
          </div>

          {/* Security Alerts */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Shield className="h-5 w-5 text-purple-600" />
            </div>
            <div className={`text-2xl font-bold ${criticalAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totalSecurityAlerts}
            </div>
            <p className="text-xs text-muted-foreground">Security Alerts</p>
            <Badge
              variant={criticalAlerts > 0 ? 'destructive' : 'default'}
              className="mt-1"
            >
              {criticalAlerts > 0 ? `${criticalAlerts} Critical` : 'All Clear'}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Security Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Alert Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(securitySummary).map(([severity, count]) => {
              const isActive = count > 0;
              return (
                <div
                  key={severity}
                  className={`text-center p-2 rounded border ${
                    isActive
                      ? severity === 'critical' || severity === 'high'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`text-lg font-bold ${
                    isActive
                      ? severity === 'critical'
                        ? 'text-red-600'
                        : severity === 'high'
                        ? 'text-orange-600'
                        : severity === 'medium'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                      : 'text-gray-500'
                  }`}>
                    {count}
                  </div>
                  <p className="text-xs capitalize text-muted-foreground">
                    {severity}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Performance Indicators */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Server className="h-4 w-4" />
            Performance Indicators
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service Availability</span>
              <div className="flex items-center gap-2">
                <Progress value={systemHealth.uptime} className="w-20 h-2" />
                <span className={`font-medium ${healthStatus.color}`}>
                  {systemHealth.uptime.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Response Performance</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={Math.max(0, 100 - (systemHealth.avgResponseTime / 5))} // 500ms = 0%, 0ms = 100%
                  className="w-20 h-2"
                />
                <span className={`font-medium ${responseStatus.color}`}>
                  {systemHealth.avgResponseTime}ms
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reliability</span>
              <div className="flex items-center gap-2">
                <Progress
                  value={Math.max(0, 100 - (systemHealth.errorRate * 20))} // 5% errors = 0%, 0% = 100%
                  className="w-20 h-2"
                />
                <span className={`font-medium ${errorStatus.color}`}>
                  {(100 - systemHealth.errorRate).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/admin/system/monitoring">
              <Activity className="mr-2 h-4 w-4" />
              View Monitoring
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/admin/system/logs">
              <Clock className="mr-2 h-4 w-4" />
              System Logs
            </Link>
          </Button>
          {criticalAlerts > 0 && (
            <Button asChild variant="destructive" size="sm" className="flex-1">
              <Link href="/admin/security">
                <Shield className="mr-2 h-4 w-4" />
                Security Center
              </Link>
            </Button>
          )}
        </div>

        {/* Status Timestamp */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {new Date().toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}