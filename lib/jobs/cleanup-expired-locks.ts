/**
 * Cleanup Expired Locks Job
 *
 * Periodic job to clean up expired card locks
 * Should be run via cron job or scheduled task
 */

import { cleanupExpiredLocks } from '@/lib/services/card-lock-service';

/**
 * Main cleanup function
 * Run this every minute via cron: star-slash-1 star star star star (replace star-slash with the actual symbols)
 */
export async function cleanupExpiredLocksJob() {
  try {
    console.log('[Lock Cleanup] Starting expired locks cleanup...');
    const cleanedCount = await cleanupExpiredLocks();
    console.log(`[Lock Cleanup] Cleaned up ${cleanedCount} expired locks`);
    return cleanedCount;
  } catch (error) {
    console.error('[Lock Cleanup] Error cleaning up expired locks:', error);
    throw error;
  }
}

/**
 * Run if called directly
 */
if (require.main === module) {
  cleanupExpiredLocksJob()
    .then((count) => {
      console.log(`Successfully cleaned ${count} locks`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cleanup failed:', error);
      process.exit(1);
    });
}
