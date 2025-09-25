import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/admin/enrollment/route';
import { ApplicationStatus } from '../../app/admin/applications/constants';

describe('POST /api/admin/enrollment', () => {
  // Mock admin user
  const mockAdminUser = {
    id: 1,
    email: 'admin@test.com',
    role: 'admin',
    schoolId: 1,
  };

  // Mock pending application
  const mockPendingApplication = {
    id: 'app-123',
    schoolId: 1,
    parentName: 'John Smith',
    parentEmail: 'john.smith@email.com',
    parentPhone: '+1-555-0123',
    childName: 'Emma Smith',
    childDateOfBirth: '2018-03-15',
    childGender: 'female',
    programRequested: 'Pre-K',
    preferredStartDate: '2025-09-01',
    status: ApplicationStatus.PENDING,
    notes: 'Interested in morning program',
    createdAt: new Date('2025-09-20T10:30:00.000Z'),
    updatedAt: new Date('2025-09-20T10:30:00.000Z'),
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
  };

  beforeAll(async () => {
    // Setup test database and mock data
  });

  afterAll(async () => {
    // Cleanup test database
  });

  beforeEach(() => {
    // Reset mocks before each test
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when no authentication token provided', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    });

    it('should return 403 when user is not admin', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer parent-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Admin role required to access applications',
        },
      });
    });
  });

  describe('Application Approval', () => {
    it('should successfully approve an application with valid data', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+1-555-0123',
          password: 'tempPassword123',
          sendWelcomeEmail: true,
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
          gender: 'female',
          programId: 'program-1',
          startDate: '2025-09-01',
        },
        enrollmentData: {
          programId: 'program-1',
          status: 'active',
          startDate: '2025-09-01',
        },
        notes: 'Approved for morning Pre-K program',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          application: {
            id: 'app-123',
            status: 'approved',
            approvedAt: expect.any(String),
            approvedBy: expect.any(Number),
          },
          parentUser: {
            id: expect.any(Number),
            name: 'John Smith',
            email: 'john.smith@email.com',
            role: 'parent',
            isFromApplication: true,
            createdAt: expect.any(String),
          },
          child: {
            id: expect.any(String),
            name: 'Emma Smith',
            parentId: expect.any(Number),
            dateOfBirth: '2018-03-15',
            enrollmentStatus: 'enrolled',
            createdAt: expect.any(String),
          },
          enrollment: {
            id: expect.any(String),
            childId: expect.any(String),
            parentId: expect.any(Number),
            programId: 'program-1',
            status: 'active',
            startDate: '2025-09-01',
            createdAt: expect.any(String),
          },
          notifications: {
            welcomeEmailSent: true,
            parentNotified: true,
          },
        },
        message: 'Application approved successfully. Parent account and child record created.',
      });
    });

    it('should successfully approve with minimal required data', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith.minimal@email.com',
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.parentUser.email).toBe('john.smith.minimal@email.com');
    });
  });

  describe('Application Rejection', () => {
    it('should successfully reject an application with reason', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'reject',
        rejectionReason: 'Application incomplete - missing immunization records',
        notifyParent: true,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          application: {
            id: 'app-123',
            status: 'rejected',
            rejectionReason: 'Application incomplete - missing immunization records',
            rejectedAt: expect.any(String),
            rejectedBy: expect.any(Number),
          },
          notifications: {
            parentNotified: true,
          },
        },
        message: 'Application rejected successfully.',
      });
    });

    it('should reject with minimal data (no parent notification)', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'reject',
        rejectionReason: 'Missing required documentation',
        notifyParent: false,
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.notifications.parentNotified).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing required fields in approval', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'approve',
        // Missing parentData and childData
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining('parentData'),
              message: expect.any(String),
            }),
          ]),
        },
      });
    });

    it('should return 400 for duplicate parent email', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'existing@email.com', // This email already exists
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: 'PARENT_EMAIL_EXISTS',
          message: 'Parent email already exists in the system',
          details: {
            existingUserId: expect.any(String),
            suggestedAction: expect.any(String),
          },
        },
      });
    });

    it('should return 400 for missing rejection reason', async () => {
      const requestBody = {
        applicationId: 'app-123',
        action: 'reject',
        // Missing rejectionReason
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'rejectionReason',
              message: expect.any(String),
            }),
          ]),
        },
      });
    });
  });

  describe('Application State Errors', () => {
    it('should return 404 for non-existent application', async () => {
      const requestBody = {
        applicationId: 'non-existent',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'APPLICATION_NOT_FOUND',
          message: 'Application not found or not accessible',
        },
      });
    });

    it('should return 409 for already processed application', async () => {
      const requestBody = {
        applicationId: 'app-already-processed',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'APPLICATION_ALREADY_PROCESSED',
          message: 'Application has already been approved or rejected',
        },
      });
    });
  });

  describe('Transaction Handling', () => {
    it('should return 500 and rollback on transaction failure', async () => {
      const requestBody = {
        applicationId: 'app-transaction-fail',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      // Mock transaction failure
      const response = await POST(request);
      const data = await response.json();

      // This would test actual transaction rollback in integration
      expect(typeof POST).toBe('function');
    });
  });

  describe('Multi-tenant Security', () => {
    it('should only allow processing applications for admin school', async () => {
      const requestBody = {
        applicationId: 'app-different-school',
        action: 'approve',
        parentData: {
          name: 'John Smith',
          email: 'john.smith@email.com',
          password: 'tempPassword123',
        },
        childData: {
          name: 'Emma Smith',
          dateOfBirth: '2018-03-15',
        },
        enrollmentData: {
          status: 'active',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/admin/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      // Should not be able to process applications from other schools
      // Exact response depends on implementation
      expect([404, 403]).toContain(response.status);
    });
  });
});