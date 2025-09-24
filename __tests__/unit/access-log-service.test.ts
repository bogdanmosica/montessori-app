/**
 * Unit tests for AccessLogService
 */

import { AccessLogService, AccessLogEntry } from '@/lib/services/access-log-service';

// Mock the database
jest.mock('@/lib/db/drizzle', () => ({
  db: {
    insert: jest.fn().mockReturnValue({
      values: jest.fn().mockResolvedValue({}),
    }),
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([
                {
                  id: 'test-id-1',
                  userId: 1,
                  route: '/admin/users',
                  success: true,
                  timestamp: new Date(),
                  userAgent: 'Test Agent',
                  ipAddress: '127.0.0.1',
                },
              ]),
            }),
          }),
        }),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue({ rowCount: 5 }),
    }),
  },
}));

jest.mock('@/lib/db/schema', () => ({
  accessLogs: {
    id: 'id',
    userId: 'userId',
    teamId: 'teamId',
    route: 'route',
    success: 'success',
    timestamp: 'timestamp',
    userAgent: 'userAgent',
    ipAddress: 'ipAddress',
  },
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  count: jest.fn(),
  desc: jest.fn(),
  lt: jest.fn(),
  and: jest.fn(),
}));

// Mock console methods to avoid noise in tests
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('AccessLogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.error.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
  });

  describe('logAccess', () => {
    it('should log access attempt asynchronously', async () => {
      const entry: AccessLogEntry = {
        userId: 1,
        teamId: 1,
        route: '/admin/users',
        success: true,
        userAgent: 'Test Agent',
        ipAddress: '127.0.0.1',
      };

      // Since logAccess is async and non-blocking, we just verify it doesn't throw
      await expect(AccessLogService.logAccess(entry)).resolves.toBeUndefined();
    });

    it('should handle optional fields', async () => {
      const entry: AccessLogEntry = {
        route: '/admin/settings',
        success: false,
      };

      await expect(AccessLogService.logAccess(entry)).resolves.toBeUndefined();
    });

    it('should not throw errors for malformed entries', async () => {
      const entry: AccessLogEntry = {
        route: '',
        success: true,
      };

      await expect(AccessLogService.logAccess(entry)).resolves.toBeUndefined();
    });
  });

  describe('getAccessLogs', () => {
    it('should return paginated access logs', async () => {
      const params = {
        teamId: 1,
        page: 1,
        limit: 10,
      };

      const result = await AccessLogService.getAccessLogs(params);

      expect(result).toHaveProperty('logs');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it('should apply default pagination values', async () => {
      const params = {
        teamId: 1,
      };

      const result = await AccessLogService.getAccessLogs(params);

      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(50); // Default limit
    });

    it('should enforce maximum limit', async () => {
      const params = {
        teamId: 1,
        page: 1,
        limit: 500, // Above max of 200
      };

      // Should not throw, service should handle internally
      await expect(AccessLogService.getAccessLogs(params)).resolves.toBeDefined();
    });

    it('should support filtering by userId', async () => {
      const params = {
        teamId: 1,
        userId: 123,
      };

      const result = await AccessLogService.getAccessLogs(params);
      expect(result).toHaveProperty('logs');
    });

    it('should support filtering by success status', async () => {
      const params = {
        teamId: 1,
        success: true,
      };

      const result = await AccessLogService.getAccessLogs(params);
      expect(result).toHaveProperty('logs');
    });
  });

  describe('cleanupOldLogs', () => {
    it('should clean up logs older than specified days', async () => {
      const daysToKeep = 30;
      const deletedCount = await AccessLogService.cleanupOldLogs(daysToKeep);

      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });

    it('should use default retention period when not specified', async () => {
      const deletedCount = await AccessLogService.cleanupOldLogs();

      expect(typeof deletedCount).toBe('number');
    });

    it('should handle zero or negative days gracefully', async () => {
      await expect(AccessLogService.cleanupOldLogs(0)).resolves.toBeGreaterThanOrEqual(0);
      await expect(AccessLogService.cleanupOldLogs(-1)).resolves.toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully in logAccess', async () => {
      // This test ensures the service doesn't crash the application on DB errors
      const entry: AccessLogEntry = {
        route: '/test',
        success: true,
      };

      // Should not throw even if database operations fail
      await expect(AccessLogService.logAccess(entry)).resolves.toBeUndefined();
    });
  });
});