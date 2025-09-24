// T021: Create CapacityCard server component
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AgeGroupCapacity } from '@/lib/types/dashboard';
import { CAPACITY_UTILIZATION_THRESHOLDS } from '../constants';
import Link from 'next/link';

interface CapacityCardProps {
  capacityByAgeGroup: AgeGroupCapacity[];
  totalCapacity: number;
  activeEnrollments: number;
  capacityUtilization: number;
  className?: string;
}

export default function CapacityCard({
  capacityByAgeGroup,
  totalCapacity,
  activeEnrollments,
  capacityUtilization,
  className
}: CapacityCardProps) {
  const getCapacityStatus = (utilization: number) => {
    if (utilization >= CAPACITY_UTILIZATION_THRESHOLDS.CRITICAL) return 'critical';
    if (utilization >= CAPACITY_UTILIZATION_THRESHOLDS.HIGH) return 'high';
    if (utilization >= CAPACITY_UTILIZATION_THRESHOLDS.MEDIUM) return 'medium';
    return 'low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const getProgressColor = (utilization: number) => {
    if (utilization >= CAPACITY_UTILIZATION_THRESHOLDS.HIGH) return 'bg-red-500';
    if (utilization >= CAPACITY_UTILIZATION_THRESHOLDS.MEDIUM) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const overallStatus = getCapacityStatus(capacityUtilization);
  const availableSpots = totalCapacity - activeEnrollments;

  return (
    <Card data-testid="capacity-card" className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Capacity Overview
          </div>
          <Badge
            variant={overallStatus === 'critical' || overallStatus === 'high' ? 'destructive' : 'default'}
            className={getStatusColor(overallStatus)}
          >
            {capacityUtilization}% Utilized
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Capacity */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Capacity</span>
            <span className="text-sm text-muted-foreground">
              {activeEnrollments} / {totalCapacity}
            </span>
          </div>
          <Progress
            value={capacityUtilization}
            className="h-2"
            // Custom styling would be applied via Tailwind classes
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{availableSpots} spots available</span>
            {overallStatus === 'critical' && (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-3 w-3" />
                Near capacity limit
              </span>
            )}
          </div>
        </div>

        {/* Age Group Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">By Age Group</h4>
          <div className="space-y-3">
            {capacityByAgeGroup.map((ageGroup, index) => {
              const utilization = (ageGroup.currentEnrollment / ageGroup.capacity) * 100;
              const status = getCapacityStatus(utilization);

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{ageGroup.ageGroup}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {ageGroup.currentEnrollment} / {ageGroup.capacity}
                      </span>
                      {status === 'critical' ? (
                        <AlertTriangle className="h-3 w-3 text-red-600" />
                      ) : (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={utilization}
                    className="h-1.5"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {Math.round(utilization)}% utilized
                    </span>
                    <span className={`font-medium ${getStatusColor(status)}`}>
                      {ageGroup.availableSpots > 0
                        ? `${ageGroup.availableSpots} spots`
                        : 'Full'
                      }
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Capacity Alerts */}
        {overallStatus === 'critical' && (
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Capacity Alert</span>
            </div>
            <p className="text-xs text-red-700 mt-1">
              School is at {capacityUtilization}% capacity. Consider reviewing waitlist or increasing capacity.
            </p>
            <div className="flex gap-2 mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/waitlist">
                  Manage Waitlist
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/settings/capacity">
                  Update Capacity
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Age Group Capacity Issues */}
        {capacityByAgeGroup.some(group => (group.currentEnrollment / group.capacity) * 100 >= CAPACITY_UTILIZATION_THRESHOLDS.HIGH) && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">Age Group Issues</span>
            </div>
            <div className="text-xs text-orange-700 mt-1">
              {capacityByAgeGroup
                .filter(group => (group.currentEnrollment / group.capacity) * 100 >= CAPACITY_UTILIZATION_THRESHOLDS.HIGH)
                .map(group => (
                  <div key={group.ageGroup}>
                    {group.ageGroup} is at {Math.round((group.currentEnrollment / group.capacity) * 100)}% capacity
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/admin/enrollments">
              View Enrollments
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link href="/admin/applications">
              Review Applications
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}