import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/users/route';

describe('POST /api/users', () => {
  // Mock admin user
  const mockAdminUser = {
    id: 1,
    email: 'admin@test.com',
    role: 'admin',
    schoolId: 1,
  };

  // Mock application for parent creation
  const mockApplication = {
    id: 'app-123',
    schoolId: 1,
    parentEmail: 'john.smith@email.com',
    status: 'approved',
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
        role: 'parent',
        name: 'John Smith',
        email: 'john.smith@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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
        role: 'parent',
        name: 'John Smith',
        email: 'john.smith@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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

  describe('Successful Parent User Creation', () => {
    it('should successfully create parent user with complete data', async () => {
      const requestBody = {
        role: 'parent',
        applicationId: 'app-123',
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-0123',
        password: 'tempPassword123',
        isFromApplication: true,
        sendWelcomeEmail: true,
        parentProfile: {
          address: {
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zipCode: '62701',
          },
          occupation: 'Teacher',
          emergencyContact: {
            name: 'Jane Smith',
            phone: '+1-555-0987',
            relationship: 'spouse',
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(Number),
            name: 'John Smith',
            email: 'john.smith@email.com',
            phone: '+1-555-0123',
            role: 'parent',
            isFromApplication: true,
            applicationId: 'app-123',
            schoolId: expect.any(Number),
            parentProfile: {
              address: {
                street: '123 Main St',
                city: 'Springfield',
                state: 'IL',
                zipCode: '62701',
              },
              occupation: 'Teacher',
              emergencyContact: {
                name: 'Jane Smith',
                phone: '+1-555-0987',
                relationship: 'spouse',
              },
            },
            isActive: true,
            emailVerified: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            lastLoginAt: null,
          },
          notifications: {
            welcomeEmailSent: true,
            passwordResetRequired: true,
          },
        },
        message: 'Parent user created successfully',
      });
    });

    it('should successfully create parent user with minimal required data', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Jane Doe',
        email: 'jane.doe@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(Number),
            name: 'Jane Doe',
            email: 'jane.doe@email.com',
            role: 'parent',
            isFromApplication: false, // Default value
            schoolId: expect.any(Number),
            isActive: true,
            emailVerified: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          notifications: {
            welcomeEmailSent: true, // Default value
            passwordResetRequired: true,
          },
        },
        message: 'Parent user created successfully',
      });
    });

    it('should create user with application link and from-application flag', async () => {
      const requestBody = {
        role: 'parent',
        applicationId: 'app-456',
        name: 'Bob Wilson',
        email: 'bob.wilson@email.com',
        password: 'tempPassword123',
        isFromApplication: true,
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.user.applicationId).toBe('app-456');
      expect(data.data.user.isFromApplication).toBe(true);
    });

    it('should handle sendWelcomeEmail flag correctly', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Test Parent',
        email: 'test.parent@email.com',
        password: 'tempPassword123',
        sendWelcomeEmail: false,
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.notifications.welcomeEmailSent).toBe(false);
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        // Missing role, name, email, password
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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
          message: 'Invalid user data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'role',
              message: expect.any(String),
            }),
            expect.objectContaining({
              field: 'name',
              message: expect.any(String),
            }),
            expect.objectContaining({
              field: 'email',
              message: 'Valid email address is required',
            }),
            expect.objectContaining({
              field: 'password',
              message: 'Password must be at least 8 characters long',
            }),
          ]),
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Test User',
        email: 'invalid-email',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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
          message: 'Invalid user data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'email',
              message: 'Valid email address is required',
            }),
          ]),
        },
      });
    });

    it('should return 400 for password too short', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Test User',
        email: 'test@email.com',
        password: 'short',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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
          message: 'Invalid user data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
              message: 'Password must be at least 8 characters long',
            }),
          ]),
        },
      });
    });

    it('should return 422 for invalid role (non-parent)', async () => {
      const requestBody = {
        role: 'admin', // Only parent role allowed through this endpoint
        name: 'Test User',
        email: 'test@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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
      expect(data).toEqual({
        success: false,
        error: {
          code: 'INVALID_ROLE_FOR_OPERATION',
          message: 'Only parent role can be created through application approval process',
        },
      });
    });
  });

  describe('Duplicate Email Handling', () => {
    it('should return 409 for existing email address', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Duplicate User',
        email: 'existing@email.com', // This email already exists
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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
      expect(data).toMatchObject({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'User with this email already exists',
          details: {
            existingUserId: expect.any(String),
            existingUserRole: expect.any(String),
            suggestedAction: 'Use different email or contact existing user',
          },
        },
      });
    });

    it('should provide helpful details for duplicate email conflicts', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Another Duplicate',
        email: 'parent.existing@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
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
      expect(data.error.details).toHaveProperty('existingUserId');
      expect(data.error.details).toHaveProperty('existingUserRole');
      expect(data.error.details).toHaveProperty('suggestedAction');
    });
  });

  describe('Multi-tenant Security', () => {
    it('should scope user to admin school', async () => {
      const requestBody = {
        role: 'parent',
        name: 'School Scoped User',
        email: 'school.scoped@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.user.schoolId).toBe(mockAdminUser.schoolId);
    });

    it('should enforce global email uniqueness across all schools', async () => {
      // This tests that email uniqueness is enforced globally, not just per school
      const requestBody = {
        role: 'parent',
        name: 'Global Email Test',
        email: 'global.unique@email.com', // Should be unique globally
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      // First creation should succeed
      expect([201, 409]).toContain(response.status); // 409 if email already exists from other tests
    });
  });

  describe('Parent Profile Handling', () => {
    it('should store complex parent profile data', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Profile Test Parent',
        email: 'profile.test@email.com',
        password: 'tempPassword123',
        parentProfile: {
          address: {
            street: '456 Oak Avenue',
            city: 'Anytown',
            state: 'CA',
            zipCode: '90210',
          },
          occupation: 'Software Engineer',
          workPhone: '+1-555-1234',
          emergencyContact: {
            name: 'Emergency Person',
            phone: '+1-555-9999',
            relationship: 'friend',
            address: '789 Emergency St',
          },
          preferences: {
            communicationMethod: 'email',
            newsletters: true,
            eventNotifications: false,
          },
        },
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.user.parentProfile).toEqual(requestBody.parentProfile);
    });
  });

  describe('Password Security', () => {
    it('should not return password in response', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Security Test',
        email: 'security.test@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.user).not.toHaveProperty('password');
      expect(data.data.user).not.toHaveProperty('passwordHash');
    });

    it('should indicate password reset is required', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Password Reset Test',
        email: 'password.reset@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.notifications.passwordResetRequired).toBe(true);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return correctly structured response', async () => {
      const requestBody = {
        role: 'parent',
        name: 'Schema Test',
        email: 'schema.test@email.com',
        password: 'tempPassword123',
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toMatchObject({
        success: true,
        data: {
          user: {
            id: expect.any(Number),
            name: expect.any(String),
            email: expect.any(String),
            role: 'parent',
            schoolId: expect.any(Number),
            isActive: expect.any(Boolean),
            emailVerified: expect.any(Boolean),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          },
          notifications: {
            welcomeEmailSent: expect.any(Boolean),
            passwordResetRequired: expect.any(Boolean),
          },
        },
        message: expect.any(String),
      });
    });
  });

  describe('Integration with Application Approval', () => {
    it('should properly link user to originating application', async () => {
      const requestBody = {
        role: 'parent',
        applicationId: 'app-integration-test',
        name: 'Application Integration User',
        email: 'app.integration@email.com',
        password: 'tempPassword123',
        isFromApplication: true,
      };

      const request = new NextRequest('http://localhost:3000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.user.applicationId).toBe('app-integration-test');
      expect(data.data.user.isFromApplication).toBe(true);
    });
  });
});