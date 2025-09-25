/**
 * Unit Tests: Applications Server Functions
 * 
 * Tests the server functions used for applications data fetching and processing.
 * These functions handle server-side rendering and data management logic.
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals';
import { db } from '../../lib/db/drizzle';
import { applicationsNew, users } from '../../lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Import the server functions to test
import {
  getApplicationsForPage,
  validateApplicationsAccess,
  getApplicationsStatsForDashboard,
} from '../../app/admin/applications/server/applications';

// Mock Auth.js
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}));

import { auth } from '../../lib/auth';

describe('Applications Server Functions Unit Tests', () => {
  let testSchoolId: number;
  let testAdminUser: any;
  let testApplications: any[];

  beforeAll(async () => {
    testSchoolId = 1; // Mock school ID
    testAdminUser = {
      id: '1',
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'admin',
      schoolId: testSchoolId,
    };
  });

  beforeEach(async () => {
    // Mock auth to return test admin user
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
      user: testAdminUser,
    });

    // Create test applications
    const applications = await db
      .insert(applicationsNew)
      .values([
        {
          schoolId: testSchoolId,
          parentName: 'John Smith',
          parentEmail: 'john@example.com',
          childName: 'Jane Smith',
          childDateOfBirth: new Date('2019-03-15'),
          programRequested: 'Pre-K Program',
          status: 'pending',
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
        },
        {
          schoolId: testSchoolId,
          parentName: 'Alice Johnson',
          parentEmail: 'alice@example.com',
          childName: 'Bob Johnson',
          childDateOfBirth: new Date('2020-08-22'),
          programRequested: 'Toddler Program',
          status: 'approved',
          approvedAt: new Date('2025-01-20'),
          approvedBy: parseInt(testAdminUser.id),
          createdAt: new Date('2025-01-10'),
          updatedAt: new Date('2025-01-20'),
        },
        {
          schoolId: testSchoolId,
          parentName: 'Carol Brown',
          parentEmail: 'carol@example.com',
          childName: 'David Brown',
          childDateOfBirth: new Date('2018-12-05'),
          programRequested: 'Kindergarten Prep',
          status: 'rejected',
          rejectedAt: new Date('2025-01-18'),
          rejectedBy: parseInt(testAdminUser.id),
          rejectionReason: 'Program full for this age group',
          createdAt: new Date('2025-01-12'),
          updatedAt: new Date('2025-01-18'),
        },
        {
          schoolId: 999, // Different school - should not appear in results
          parentName: 'Other School Parent',
          parentEmail: 'other@example.com',
          childName: 'Other Child',
          childDateOfBirth: new Date('2020-01-01'),
          programRequested: 'Pre-K',
          status: 'pending',
          createdAt: new Date('2025-01-16'),
          updatedAt: new Date('2025-01-16'),
        },
      ])
      .returning();

    testApplications = applications;
  });

  afterEach(async () => {
    // Clean up test data
    if (testApplications && testApplications.length > 0) {
      const applicationIds = testApplications.map(app => app.id);
      for (const id of applicationIds) {
        await db.delete(applicationsNew).where(eq(applicationsNew.id, id));
      }
    }
  });

  describe('validateApplicationsAccess', () => {
    it('should validate admin access successfully', async () => {
      const result = await validateApplicationsAccess();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject unauthenticated users', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(null);

      const result = await validateApplicationsAccess();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Authentication');
    });

    it('should reject users without admin permissions', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { ...testAdminUser, role: 'parent' },
      });

      const result = await validateApplicationsAccess();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('permissions');
    });

    it('should allow super admin users', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { ...testAdminUser, role: 'SUPER_ADMIN' },
      });

      const result = await validateApplicationsAccess();

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject users without school association', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { ...testAdminUser, schoolId: null },
      });

      const result = await validateApplicationsAccess();

      expect(result.valid).toBe(false);
      expect(result.error).toContain('school');
    });
  });

  describe('getApplicationsForPage', () => {
    beforeEach(() => {
      // Reset auth mock to return valid admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: testAdminUser,
      });
    });

    it('should return paginated applications for valid admin', async () => {
      const searchParams = new URLSearchParams({
        page: '1',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.applications).toHaveLength(3); // Should exclude other school's application
        expect(result.data.pagination.totalItems).toBe(3);
        expect(result.data.pagination.currentPage).toBe(1);
        expect(result.data.applications.every(app => app.schoolId === testSchoolId)).toBe(true);
      }
    });

    it('should filter applications by status', async () => {
      const searchParams = new URLSearchParams({
        status: 'pending',
        page: '1',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.applications).toHaveLength(1);
        expect(result.data.applications[0].status).toBe('pending');
        expect(result.data.applications[0].parentName).toBe('John Smith');
      }
    });

    it('should search applications by parent name', async () => {
      const searchParams = new URLSearchParams({
        search: 'Alice',
        page: '1',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.applications).toHaveLength(1);
        expect(result.data.applications[0].parentName).toBe('Alice Johnson');
      }
    });

    it('should search applications by child name', async () => {
      const searchParams = new URLSearchParams({
        search: 'David',
        page: '1',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.applications).toHaveLength(1);
        expect(result.data.applications[0].childName).toBe('David Brown');
      }
    });

    it('should handle pagination correctly', async () => {
      const searchParams = new URLSearchParams({
        page: '1',
        limit: '2',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.applications).toHaveLength(2);
        expect(result.data.pagination.currentPage).toBe(1);
        expect(result.data.pagination.totalPages).toBe(2); // 3 applications / 2 per page = 2 pages
        expect(result.data.pagination.hasNextPage).toBe(true);
        expect(result.data.pagination.hasPrevPage).toBe(false);
      }
    });

    it('should sort applications by creation date descending by default', async () => {
      const searchParams = new URLSearchParams({
        page: '1',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data && result.data.applications.length >= 2) {
        const applications = result.data.applications;
        // Most recent should be first
        expect(new Date(applications[0].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(applications[1].createdAt).getTime());
      }
    });

    it('should return error for unauthorized access', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(null);

      const searchParams = new URLSearchParams({
        page: '1',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const searchParams = new URLSearchParams({
        page: 'invalid',
        limit: 'invalid',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        // Should default to page 1, reasonable limit
        expect(result.data.pagination.currentPage).toBe(1);
        expect(result.data.pagination.limit).toBeGreaterThan(0);
      }
    });
  });

  describe('getApplicationsStatsForDashboard', () => {
    beforeEach(() => {
      // Reset auth mock to return valid admin user
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: testAdminUser,
      });
    });

    it('should return correct application statistics', async () => {
      const result = await getApplicationsStatsForDashboard();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.total).toBe(3); // Only applications from test school
        expect(result.data.pending).toBe(1); // John Smith's application
        expect(result.data.approved).toBe(1); // Alice Johnson's application
        expect(result.data.rejected).toBe(1); // Carol Brown's application
      }
    });

    it('should return zero stats for schools with no applications', async () => {
      // Clean up existing applications first
      if (testApplications && testApplications.length > 0) {
        const applicationIds = testApplications.map(app => app.id);
        for (const id of applicationIds) {
          await db.delete(applicationsNew).where(eq(applicationsNew.id, id));
        }
      }

      const result = await getApplicationsStatsForDashboard();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.total).toBe(0);
        expect(result.data.pending).toBe(0);
        expect(result.data.approved).toBe(0);
        expect(result.data.rejected).toBe(0);
      }
    });

    it('should return error for unauthorized access', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(null);

      const result = await getApplicationsStatsForDashboard();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should respect multi-tenant scoping', async () => {
      const result = await getApplicationsStatsForDashboard();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        // Should only count applications from testSchoolId (1), not from school 999
        expect(result.data.total).toBe(3);
        // The application for school 999 should not be counted
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database to throw an error
      const originalSelect = db.select;
      db.select = jest.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const searchParams = new URLSearchParams({ page: '1', limit: '10' });
      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      // Restore original function
      db.select = originalSelect;
    });

    it('should handle empty search results', async () => {
      const searchParams = new URLSearchParams({
        search: 'NonexistentName',
        page: '1',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        expect(result.data.applications).toHaveLength(0);
        expect(result.data.pagination.totalItems).toBe(0);
        expect(result.data.pagination.totalPages).toBe(0);
      }
    });

    it('should handle very large page numbers', async () => {
      const searchParams = new URLSearchParams({
        page: '999',
        limit: '10',
      });

      const result = await getApplicationsForPage(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (result.data) {
        // Should return empty results but not error
        expect(result.data.applications).toHaveLength(0);
        expect(result.data.pagination.currentPage).toBe(999);
      }
    });
  });
});