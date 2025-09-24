/**
 * Performance tests for middleware execution time
 * Ensures admin route protection meets performance requirements (<200ms)
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock dependencies for performance testing
jest.mock('@/lib/auth/session', () => ({
  verifyToken: jest.fn().mockResolvedValue({
    user: {
      id: 1,
      role: 'admin',
      teamId: 1,
      sessionVersion: 1,
    },
  }),
}));

jest.mock('@/lib/services/access-log-service', () => ({
  AccessLogService: {
    logAccess: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('@/lib/constants/user-roles', () => ({
  UserRole: {
    ADMIN: 'admin',
    TEACHER: 'teacher',
    PARENT: 'parent',
  },
}));

// Import middleware after mocking dependencies
import { middleware } from '@/middleware';

describe('Middleware Performance Tests', () => {
  const createMockRequest = (pathname: string, hasCookie: boolean = true) => {
    const mockRequest = {
      nextUrl: { pathname },
      cookies: {
        get: jest.fn().mockReturnValue(
          hasCookie ? { value: 'mock-session-token' } : undefined
        ),
      },
      headers: {
        get: jest.fn().mockImplementation((header) => {
          switch (header) {
            case 'user-agent':
              return 'Test Agent';
            case 'x-forwarded-for':
              return '127.0.0.1';
            default:
              return null;
          }
        }),
      },
      method: 'GET',
      url: `http://localhost:3000${pathname}`,
    } as unknown as NextRequest;

    return mockRequest;
  };

  // Mock NextResponse methods
  beforeAll(() => {
    global.NextResponse = {
      next: jest.fn().mockReturnValue({ status: 200 }),
      redirect: jest.fn().mockReturnValue({ status: 302 }),
    } as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process admin route access under 200ms', async () => {
    const request = createMockRequest('/admin/users');

    const startTime = performance.now();
    await middleware(request);
    const endTime = performance.now();

    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(200); // Must be under 200ms
    console.log(`Admin route middleware execution time: ${executionTime.toFixed(2)}ms`);
  });

  it('should process unauthorized access under 50ms', async () => {
    const request = createMockRequest('/admin/settings', false); // No cookie

    const startTime = performance.now();
    await middleware(request);
    const endTime = performance.now();

    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(50); // Should be very fast for unauthorized
    console.log(`Unauthorized middleware execution time: ${executionTime.toFixed(2)}ms`);
  });

  it('should process non-admin routes under 10ms', async () => {
    const request = createMockRequest('/dashboard');

    const startTime = performance.now();
    await middleware(request);
    const endTime = performance.now();

    const executionTime = endTime - startTime;

    expect(executionTime).toBeLessThan(10); // Non-admin routes should be very fast
    console.log(`Non-admin route middleware execution time: ${executionTime.toFixed(2)}ms`);
  });

  it('should handle bulk admin route requests efficiently', async () => {
    const adminRoutes = [
      '/admin/users',
      '/admin/settings',
      '/admin/reports',
      '/admin/access-logs',
      '/admin/dashboard',
    ];

    const startTime = performance.now();

    // Process multiple admin routes concurrently
    const promises = adminRoutes.map(route => {
      const request = createMockRequest(route);
      return middleware(request);
    });

    await Promise.all(promises);

    const endTime = performance.now();
    const totalExecutionTime = endTime - startTime;
    const averageTime = totalExecutionTime / adminRoutes.length;

    expect(averageTime).toBeLessThan(200); // Average should still be under 200ms
    expect(totalExecutionTime).toBeLessThan(1000); // Total should be under 1 second

    console.log(`Bulk admin routes average execution time: ${averageTime.toFixed(2)}ms`);
    console.log(`Bulk admin routes total execution time: ${totalExecutionTime.toFixed(2)}ms`);
  });

  it('should maintain performance under concurrent load', async () => {
    const concurrentRequests = 10;
    const requests = Array(concurrentRequests).fill(null).map((_, index) =>
      createMockRequest(`/admin/test-${index}`)
    );

    const startTime = performance.now();

    // Simulate concurrent requests
    const promises = requests.map(request => middleware(request));
    await Promise.all(promises);

    const endTime = performance.now();
    const totalExecutionTime = endTime - startTime;
    const averageTime = totalExecutionTime / concurrentRequests;

    expect(averageTime).toBeLessThan(300); // Allow slightly higher under load
    console.log(`Concurrent load average execution time: ${averageTime.toFixed(2)}ms`);
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks during repeated execution', async () => {
      const request = createMockRequest('/admin/users');
      const iterations = 100;

      // Warm up
      await middleware(request);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage();

      // Run many iterations
      for (let i = 0; i < iterations; i++) {
        await middleware(request);
      }

      // Force garbage collection again
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();

      // Memory growth should be minimal (allow some variance)
      const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      const growthPerIteration = heapGrowth / iterations;

      // Should not grow more than 1KB per iteration
      expect(growthPerIteration).toBeLessThan(1024);

      console.log(`Memory growth per middleware execution: ${growthPerIteration.toFixed(2)} bytes`);
    });
  });
});