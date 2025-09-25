/**
 * Integration Test: Application Rejection Workflow
 * 
 * Tests the application rejection workflow including:
 * - Application status updates
 * - Rejection reason recording
 * - Admin identification tracking
 * - Multi-tenant scoping
 * - Error handling scenarios
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/admin/enrollment/route';
import { db } from '../../lib/db/drizzle';
import { applicationsNew, users } from '../../lib/db/schema';
import { eq } from 'drizzle-orm';

// Mock Auth.js
jest.mock('../../lib/auth', () => ({
  auth: jest.fn(),
}));

// Mock application locks
jest.mock('../../lib/utils/application-locks', () => ({
  acquireProcessingLock: jest.fn(() => ({ success: true })),
  releaseProcessingLock: jest.fn(),
  isApplicationLocked: jest.fn(() => ({ locked: false })),
}));

import { auth } from '../../lib/auth';

describe('Application Rejection Workflow Integration', () => {
  let testSchoolId: number;
  let testAdminUser: any;
  let testApplication: any;

  beforeAll(async () => {
    // Set up test environment
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
    // Create a test application for each test
    const [newApplication] = await db
      .insert(applicationsNew)
      .values({
        schoolId: testSchoolId,
        parentName: 'Test Parent',
        parentEmail: 'test.parent@example.com',
        parentPhone: '555-0123',
        childName: 'Test Child',
        childDateOfBirth: new Date('2020-06-15'), // ~4 years old
        childGender: 'male',
        programRequested: 'Pre-K Program',
        preferredStartDate: new Date('2025-09-01'),
        status: 'pending',
        notes: 'Test application for rejection testing',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    testApplication = newApplication;

    // Mock auth to return test admin user
    (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
      user: testAdminUser,
    });
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (testApplication) {
      await db.delete(applicationsNew).where(eq(applicationsNew.id, testApplication.id));
    }
  });

  describe('Successful Rejection Workflow', () => {
    it('should reject application with proper reason and admin tracking', async () => {
      const requestBody = {
        applicationId: testApplication.id,
        action: 'reject',
        rejectionReason: 'Missing required immunization records',
        notifyParent: true,
        notes: 'Rejection during integration testing - missing documents',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      // Assert successful response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('rejected');

      // Verify application status was updated
      const updatedApplication = await db
        .select()
        .from(applicationsNew)
        .where(eq(applicationsNew.id, testApplication.id))
        .limit(1);

      expect(updatedApplication).toHaveLength(1);
      expect(updatedApplication[0].status).toBe('rejected');
      expect(updatedApplication[0].rejectionReason).toBe('Missing required immunization records');
      expect(updatedApplication[0].rejectedBy).toBe(parseInt(testAdminUser.id));
      expect(updatedApplication[0].rejectedAt).toBeInstanceOf(Date);

      // Verify no parent/child records were created
      const parentRecords = await db
        .select()
        .from(users)
        .where(eq(users.email, 'test.parent@example.com'));
      expect(parentRecords).toHaveLength(0);

      // Verify response data structure
      expect(data.data).toHaveProperty('application');
      expect(data.data).toHaveProperty('notifications');
      expect(data.data.application.status).toBe('rejected');
      expect(data.data.notifications.parentNotified).toBe(true);
    });

    it('should handle rejection without parent notification', async () => {
      const requestBody = {
        applicationId: testApplication.id,
        action: 'reject',
        rejectionReason: 'Application submitted after deadline',
        notifyParent: false,
        notes: 'Late application - no notification needed',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify notification flag
      expect(data.data.notifications.parentNotified).toBe(false);

      // Verify application was rejected properly
      const updatedApplication = await db
        .select()
        .from(applicationsNew)
        .where(eq(applicationsNew.id, testApplication.id))
        .limit(1);

      expect(updatedApplication[0].status).toBe('rejected');
      expect(updatedApplication[0].rejectionReason).toBe('Application submitted after deadline');
    });
  });

  describe('Error Handling', () => {
    it('should require rejection reason', async () => {
      const requestBody = {
        applicationId: testApplication.id,
        action: 'reject',
        // Missing rejectionReason
        notifyParent: true,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('VALIDATION_ERROR');
      expect(data.error.details.some((detail: any) => 
        detail.field === 'rejectionReason'
      )).toBe(true);

      // Verify application status wasn't changed
      const application = await db
        .select()
        .from(applicationsNew)
        .where(eq(applicationsNew.id, testApplication.id))
        .limit(1);
      expect(application[0].status).toBe('pending');
    });

    it('should prevent rejecting already processed application', async () => {
      // First, approve the application
      const approvalBody = {
        applicationId: testApplication.id,
        action: 'approve',
        parentData: {
          name: 'Test Parent',
          email: 'test.parent@example.com',
          password: 'SecurePassword123!',
        },
        childData: {
          name: 'Test Child',
          dateOfBirth: '2020-06-15',
        },
        enrollmentData: {
          programId: 'pre-k',
        },
      };

      const approvalRequest = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(approvalBody),
      });

      const approvalResponse = await POST(approvalRequest);
      expect(approvalResponse.status).toBe(200);

      // Now try to reject the already approved application
      const rejectionBody = {
        applicationId: testApplication.id,
        action: 'reject',
        rejectionReason: 'Changed mind',
        notifyParent: false,
      };

      const rejectionRequest = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(rejectionBody),
      });

      const rejectionResponse = await POST(rejectionRequest);
      const rejectionData = await rejectionResponse.json();

      expect(rejectionResponse.status).toBe(409);
      expect(rejectionData.success).toBe(false);
      expect(rejectionData.error.code).toBe('APPLICATION_ALREADY_PROCESSED');

      // Clean up created records from approval
      await db.delete(users).where(eq(users.email, 'test.parent@example.com'));
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue(null);

      const requestBody = {
        applicationId: testApplication.id,
        action: 'reject',
        rejectionReason: 'Test rejection',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('UNAUTHORIZED');
    });

    it('should reject non-admin users', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { ...testAdminUser, role: 'parent' },
      });

      const requestBody = {
        applicationId: testApplication.id,
        action: 'reject',
        rejectionReason: 'Test rejection',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('should allow super admin users', async () => {
      (auth as jest.MockedFunction<typeof auth>).mockResolvedValue({
        user: { ...testAdminUser, role: 'SUPER_ADMIN' },
      });

      const requestBody = {
        applicationId: testApplication.id,
        action: 'reject',
        rejectionReason: 'Super admin rejection test',
        notifyParent: false,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should not allow processing applications from other schools', async () => {
      // Create an application for a different school
      const [otherSchoolApplication] = await db
        .insert(applicationsNew)
        .values({
          schoolId: 999, // Different school
          parentName: 'Other School Parent',
          parentEmail: 'other@example.com',
          childName: 'Other Child',
          childDateOfBirth: new Date('2020-01-01'),
          programRequested: 'Pre-K',
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      const requestBody = {
        applicationId: otherSchoolApplication.id,
        action: 'reject',
        rejectionReason: 'Cross-tenant test',
        notifyParent: false,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('APPLICATION_NOT_FOUND');

      // Cleanup
      await db.delete(applicationsNew).where(eq(applicationsNew.id, otherSchoolApplication.id));
    });
  });

  describe('Concurrent Processing Prevention', () => {
    it('should handle application locked by another admin', async () => {
      // Mock the application as being locked
      const { isApplicationLocked } = require('../../lib/utils/application-locks');
      isApplicationLocked.mockReturnValue({
        locked: true,
        lock: {
          adminId: '999',
          userName: 'Other Admin',
          lockedAt: new Date(),
          action: 'approve',
        },
      });

      const requestBody = {
        applicationId: testApplication.id,
        action: 'reject',
        rejectionReason: 'Concurrent test',
        notifyParent: false,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(423); // Locked
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('APPLICATION_LOCKED');
      expect(data.error.details.lockedBy).toBe('Other Admin');

      // Reset mock for other tests
      isApplicationLocked.mockReturnValue({ locked: false });
    });
  });
});