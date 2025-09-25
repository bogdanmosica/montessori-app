/**
 * Application Processing Lock System
 *
 * Prevents concurrent processing of the same application by multiple admins
 * Uses in-memory locks with automatic cleanup for high availability
 */

interface ProcessingLock {
  applicationId: string;
  userId: number;
  userName: string;
  lockedAt: Date;
  action: 'approve' | 'reject';
  ttl: number; // Time to live in milliseconds
}

// In-memory storage for processing locks
// In production, this should be moved to Redis or another shared cache
const processingLocks = new Map<string, ProcessingLock>();

// Lock TTL: 5 minutes (should be enough for any processing operation)
const DEFAULT_LOCK_TTL = 5 * 60 * 1000;

// Cleanup interval: every 2 minutes
const CLEANUP_INTERVAL = 2 * 60 * 1000;

// Start cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanupInterval() {
  if (cleanupInterval) return;

  cleanupInterval = setInterval(() => {
    cleanupExpiredLocks();
  }, CLEANUP_INTERVAL);
}

function cleanupExpiredLocks() {
  const now = Date.now();

  for (const [applicationId, lock] of processingLocks.entries()) {
    if (now > (lock.lockedAt.getTime() + lock.ttl)) {
      processingLocks.delete(applicationId);
      console.log(`Cleaned up expired lock for application ${applicationId}`);
    }
  }
}

/**
 * Attempt to acquire a processing lock for an application
 */
export function acquireProcessingLock(
  applicationId: string,
  userId: number,
  userName: string,
  action: 'approve' | 'reject',
  ttlMs: number = DEFAULT_LOCK_TTL
): { success: boolean; error?: string; currentLock?: ProcessingLock } {
  // Start cleanup if not already running
  startCleanupInterval();

  const now = new Date();
  const existingLock = processingLocks.get(applicationId);

  // Check if there's an existing lock
  if (existingLock) {
    const isExpired = now.getTime() > (existingLock.lockedAt.getTime() + existingLock.ttl);

    if (!isExpired) {
      // Lock is still valid
      if (existingLock.userId === userId) {
        // Same user trying to acquire - extend the lock
        existingLock.lockedAt = now;
        existingLock.ttl = ttlMs;
        existingLock.action = action;

        return { success: true };
      } else {
        // Different user - lock is held
        return {
          success: false,
          error: `Application is currently being ${existingLock.action}d by ${existingLock.userName}`,
          currentLock: existingLock
        };
      }
    } else {
      // Lock has expired - remove it
      processingLocks.delete(applicationId);
    }
  }

  // Acquire new lock
  const newLock: ProcessingLock = {
    applicationId,
    userId,
    userName,
    lockedAt: now,
    action,
    ttl: ttlMs,
  };

  processingLocks.set(applicationId, newLock);

  return { success: true };
}

/**
 * Release a processing lock for an application
 */
export function releaseProcessingLock(
  applicationId: string,
  userId: number
): { success: boolean; error?: string } {
  const existingLock = processingLocks.get(applicationId);

  if (!existingLock) {
    return { success: true }; // No lock to release
  }

  if (existingLock.userId !== userId) {
    return {
      success: false,
      error: `Cannot release lock owned by ${existingLock.userName}`
    };
  }

  processingLocks.delete(applicationId);
  return { success: true };
}

/**
 * Check if an application is currently locked
 */
export function isApplicationLocked(
  applicationId: string
): { locked: boolean; lock?: ProcessingLock } {
  const existingLock = processingLocks.get(applicationId);

  if (!existingLock) {
    return { locked: false };
  }

  const now = Date.now();
  const isExpired = now > (existingLock.lockedAt.getTime() + existingLock.ttl);

  if (isExpired) {
    processingLocks.delete(applicationId);
    return { locked: false };
  }

  return { locked: true, lock: existingLock };
}

/**
 * Get all current processing locks (for debugging/monitoring)
 */
export function getAllProcessingLocks(): ProcessingLock[] {
  const now = Date.now();
  const validLocks: ProcessingLock[] = [];

  for (const [applicationId, lock] of processingLocks.entries()) {
    const isExpired = now > (lock.lockedAt.getTime() + lock.ttl);

    if (!isExpired) {
      validLocks.push(lock);
    } else {
      processingLocks.delete(applicationId);
    }
  }

  return validLocks;
}

/**
 * Force release all locks for a specific user (e.g., on logout)
 */
export function releaseAllUserLocks(userId: number): number {
  let releasedCount = 0;

  for (const [applicationId, lock] of processingLocks.entries()) {
    if (lock.userId === userId) {
      processingLocks.delete(applicationId);
      releasedCount++;
    }
  }

  return releasedCount;
}

/**
 * Get lock status for multiple applications (for UI state management)
 */
export function getMultipleApplicationLockStatus(
  applicationIds: string[]
): Record<string, { locked: boolean; lock?: ProcessingLock }> {
  const result: Record<string, { locked: boolean; lock?: ProcessingLock }> = {};

  for (const applicationId of applicationIds) {
    result[applicationId] = isApplicationLocked(applicationId);
  }

  return result;
}

/**
 * Cleanup function for graceful shutdown
 */
export function cleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  processingLocks.clear();
}

// Utility type for UI components
export interface ApplicationLockInfo {
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
  action?: 'approve' | 'reject';
  isOwnLock?: boolean;
  timeRemaining?: number;
}