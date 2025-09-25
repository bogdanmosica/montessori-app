'use client';

import { useState, useEffect, useCallback } from 'react';

interface ApplicationLockStatus {
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  action?: 'approve' | 'reject';
  isOwnLock?: boolean;
}

/**
 * Custom hook to manage application lock status checking
 * This provides real-time feedback about which applications are being processed
 */
export function useApplicationLocks(applicationIds: string[]) {
  const [lockStatuses, setLockStatuses] = useState<Record<string, ApplicationLockStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check lock status for multiple applications
  const checkLockStatuses = useCallback(async (appIds: string[]) => {
    if (appIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/application-locks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationIds: appIds }),
      });

      const result = await response.json();

      if (result.success) {
        setLockStatuses(result.data);
      } else {
        setError(result.error?.message || 'Failed to check lock statuses');
      }
    } catch (err) {
      setError('Failed to check application lock statuses');
      console.error('Lock status check error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check lock status for a single application
  const checkSingleLockStatus = useCallback(async (applicationId: string) => {
    await checkLockStatuses([applicationId]);
  }, [checkLockStatuses]);

  // Get lock status for a specific application
  const getLockStatus = useCallback((applicationId: string): ApplicationLockStatus => {
    return lockStatuses[applicationId] || { isLocked: false };
  }, [lockStatuses]);

  // Check if any applications are locked
  const hasLockedApplications = useCallback((): boolean => {
    return Object.values(lockStatuses).some(status => status.isLocked);
  }, [lockStatuses]);

  // Get count of locked applications
  const getLockedCount = useCallback((): number => {
    return Object.values(lockStatuses).filter(status => status.isLocked).length;
  }, [lockStatuses]);

  // Check if current user has any locks
  const hasOwnLocks = useCallback((): boolean => {
    return Object.values(lockStatuses).some(status => status.isOwnLock);
  }, [lockStatuses]);

  // Refresh lock statuses
  const refreshLockStatuses = useCallback(() => {
    if (applicationIds.length > 0) {
      checkLockStatuses(applicationIds);
    }
  }, [applicationIds, checkLockStatuses]);

  // Auto-refresh lock statuses every 30 seconds
  useEffect(() => {
    if (applicationIds.length === 0) return;

    // Initial check
    checkLockStatuses(applicationIds);

    // Set up interval for periodic checks
    const interval = setInterval(() => {
      checkLockStatuses(applicationIds);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [applicationIds, checkLockStatuses]);

  // Clear lock statuses when applicationIds change
  useEffect(() => {
    setLockStatuses(prevStatuses => {
      const newStatuses: Record<string, ApplicationLockStatus> = {};

      // Keep only the statuses for applications that are still in the list
      applicationIds.forEach(id => {
        if (prevStatuses[id]) {
          newStatuses[id] = prevStatuses[id];
        }
      });

      return newStatuses;
    });
  }, [applicationIds]);

  return {
    lockStatuses,
    loading,
    error,
    getLockStatus,
    checkSingleLockStatus,
    hasLockedApplications,
    getLockedCount,
    hasOwnLocks,
    refreshLockStatuses,
  };
}

/**
 * Hook for managing a single application's lock status
 * Useful for individual application components or modals
 */
export function useSingleApplicationLock(applicationId: string) {
  const [lockStatus, setLockStatus] = useState<ApplicationLockStatus>({ isLocked: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkLockStatus = useCallback(async () => {
    if (!applicationId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/application-locks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applicationIds: [applicationId] }),
      });

      const result = await response.json();

      if (result.success) {
        setLockStatus(result.data[applicationId] || { isLocked: false });
      } else {
        setError(result.error?.message || 'Failed to check lock status');
      }
    } catch (err) {
      setError('Failed to check application lock status');
      console.error('Single lock status check error:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  // Check lock status periodically
  useEffect(() => {
    if (!applicationId) return;

    checkLockStatus();

    const interval = setInterval(checkLockStatus, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [applicationId, checkLockStatus]);

  return {
    lockStatus,
    loading,
    error,
    refresh: checkLockStatus,
    isLocked: lockStatus.isLocked,
    lockedBy: lockStatus.lockedBy,
    isOwnLock: lockStatus.isOwnLock,
  };
}

/**
 * Utility function to determine if an action should be disabled based on lock status
 */
export function shouldDisableAction(
  lockStatus: ApplicationLockStatus,
  requiredAction: 'approve' | 'reject' | 'view'
): { disabled: boolean; reason?: string } {
  if (!lockStatus.isLocked) {
    return { disabled: false };
  }

  // View actions are never disabled
  if (requiredAction === 'view') {
    return { disabled: false };
  }

  // If it's the user's own lock, allow the action
  if (lockStatus.isOwnLock) {
    return { disabled: false };
  }

  // Application is locked by another user
  return {
    disabled: true,
    reason: `Application is being ${lockStatus.action}d by ${lockStatus.lockedBy}`
  };
}