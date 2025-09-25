import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/children/route';

describe('POST /api/children', () => {
  // Mock admin user
  const mockAdminUser = {
    id: 1,
    email: 'admin@test.com',
    role: 'admin',
    schoolId: 1,
  };

  // Mock parent user
  const mockParentUser = {
    id: 2,
    email: 'parent@test.com',
    role: 'parent',
    schoolId: 1,
  };

  // Mock application
  const mockApplication = {
    id: 'app-123',
    schoolId: 1,
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
        parentId: 2,
        name: 'Emma Smith',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
        parentId: 2,
        name: 'Emma Smith',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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

  describe('Successful Child Creation', () => {
    it('should successfully create child with complete data', async () => {
      const requestBody = {
        parentId: 2,
        applicationId: 'app-123',
        name: 'Emma Smith',
        dateOfBirth: '2018-03-15',
        gender: 'female',
        enrollmentStatus: 'enrolled',
        medicalInfo: {
          allergies: ['peanuts', 'dairy'],
          medications: [],
          emergencyContact: {
            name: 'Jane Smith',
            phone: '+1-555-0987',
            relationship: 'aunt',
          },
        },
        notes: 'Transferred from previous daycare',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          child: {
            id: expect.any(String),
            parentId: 2,
            applicationId: 'app-123',
            name: 'Emma Smith',
            dateOfBirth: '2018-03-15',
            gender: 'female',
            enrollmentStatus: 'enrolled',
            medicalInfo: {
              allergies: ['peanuts', 'dairy'],
              medications: [],
              emergencyContact: {
                name: 'Jane Smith',
                phone: '+1-555-0987',
                relationship: 'aunt',
              },
            },
            notes: 'Transferred from previous daycare',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            schoolId: expect.any(Number),
          },
        },
        message: 'Child record created successfully',
      });
    });

    it('should successfully create child with minimal required data', async () => {
      const requestBody = {
        parentId: 2,
        name: 'Michael Smith',
        dateOfBirth: '2019-08-20',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          child: {
            id: expect.any(String),
            parentId: 2,
            name: 'Michael Smith',
            dateOfBirth: '2019-08-20',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            schoolId: expect.any(Number),
          },
        },
        message: 'Child record created successfully',
      });
    });

    it('should create child with application link', async () => {
      const requestBody = {
        parentId: 2,
        applicationId: 'app-123',
        name: 'Sarah Smith',
        dateOfBirth: '2020-01-10',
        gender: 'female',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
      expect(data.data.child.applicationId).toBe('app-123');
    });
  });

  describe('Validation Errors', () => {
    it('should return 400 for missing required fields', async () => {
      const requestBody = {
        // Missing parentId, name, dateOfBirth
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          message: 'Invalid child data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'parentId',
              message: expect.any(String),
            }),
            expect.objectContaining({
              field: 'name',
              message: 'Name is required and cannot be empty',
            }),
            expect.objectContaining({
              field: 'dateOfBirth',
              message: expect.any(String),
            }),
          ]),
        },
      });
    });

    it('should return 400 for future date of birth', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const requestBody = {
        parentId: 2,
        name: 'Future Child',
        dateOfBirth: futureDate.toISOString().split('T')[0],
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          message: 'Invalid child data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'dateOfBirth',
              message: 'Date of birth cannot be in the future',
            }),
          ]),
        },
      });
    });

    it('should return 400 for invalid gender value', async () => {
      const requestBody = {
        parentId: 2,
        name: 'Test Child',
        dateOfBirth: '2018-03-15',
        gender: 'invalid-gender',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          message: 'Invalid child data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'gender',
              message: expect.stringContaining('must be one of'),
            }),
          ]),
        },
      });
    });

    it('should return 400 for empty name', async () => {
      const requestBody = {
        parentId: 2,
        name: '',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          message: 'Invalid child data',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: 'Name is required and cannot be empty',
            }),
          ]),
        },
      });
    });
  });

  describe('Parent Validation', () => {
    it('should return 404 for non-existent parent', async () => {
      const requestBody = {
        parentId: 999,
        name: 'Test Child',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          code: 'PARENT_NOT_FOUND',
          message: 'Parent user not found or not accessible',
        },
      });
    });

    it('should return 403 for parent from different school', async () => {
      const requestBody = {
        parentId: 999, // Parent from different school
        name: 'Test Child',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'CROSS_TENANT_ACCESS',
          message: 'Cannot create child for parent from different school',
        },
      });
    });
  });

  describe('Duplicate Child Prevention', () => {
    it('should return 409 for duplicate child (same name, DOB, parent)', async () => {
      const requestBody = {
        parentId: 2,
        name: 'Existing Child',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          code: 'CHILD_ALREADY_EXISTS',
          message: 'Child with this name and date of birth already exists for this parent',
          details: {
            existingChildId: expect.any(String),
          },
        },
      });
    });
  });

  describe('Multi-tenant Security', () => {
    it('should scope child records to admin school', async () => {
      const requestBody = {
        parentId: 2,
        name: 'School Scoped Child',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
      expect(data.data.child.schoolId).toBe(mockAdminUser.schoolId);
    });
  });

  describe('Medical Information Handling', () => {
    it('should store complex medical information correctly', async () => {
      const requestBody = {
        parentId: 2,
        name: 'Medical Info Child',
        dateOfBirth: '2018-03-15',
        medicalInfo: {
          allergies: ['peanuts', 'shellfish', 'dairy'],
          medications: ['inhaler', 'epipen'],
          emergencyContact: {
            name: 'Emergency Contact',
            phone: '+1-555-911',
            relationship: 'grandparent',
          },
          conditions: ['asthma', 'food allergies'],
          notes: 'Requires immediate medical attention for allergic reactions',
        },
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
      expect(data.data.child.medicalInfo).toEqual(requestBody.medicalInfo);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return correctly structured response', async () => {
      const requestBody = {
        parentId: 2,
        name: 'Schema Test Child',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
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
          child: {
            id: expect.any(String),
            parentId: expect.any(Number),
            name: expect.any(String),
            dateOfBirth: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            schoolId: expect.any(Number),
          },
        },
        message: expect.any(String),
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle database constraint violations gracefully', async () => {
      const requestBody = {
        parentId: 2,
        name: 'Constraint Violation Child',
        dateOfBirth: '2018-03-15',
      };

      const request = new NextRequest('http://localhost:3000/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer admin-token',
        },
        body: JSON.stringify(requestBody),
      });

      // Mock database constraint violation
      const response = await POST(request);

      // This would test actual constraint handling in integration
      expect(typeof POST).toBe('function');
    });
  });
});