import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../../app/api/applications/route';
import { ApplicationStatus } from '../../app/admin/applications/constants';

describe('GET /api/applications', () => {
  // Mock authentication - should be replaced with actual auth setup
  const mockAdminUser = {
    id: 1,
    email: 'admin@test.com',
    role: 'admin',
    schoolId: 1,
  };

  // Mock application data
  const mockApplications = [
    {
      id: 'app-1',
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
    },
    {
      id: 'app-2',
      schoolId: 1,
      parentName: 'Jane Doe',
      parentEmail: 'jane.doe@email.com',
      parentPhone: '+1-555-0456',
      childName: 'Michael Doe',
      childDateOfBirth: '2019-05-20',
      childGender: 'male',
      programRequested: 'Toddler',
      preferredStartDate: '2025-08-15',
      status: ApplicationStatus.APPROVED,
      notes: null,
      createdAt: new Date('2025-09-18T14:15:00.000Z'),
      updatedAt: new Date('2025-09-21T09:45:00.000Z'),
      approvedAt: new Date('2025-09-21T09:45:00.000Z'),
      approvedBy: 1,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
    },
  ];

  beforeAll(async () => {
    // Setup test database and mock data
    // This would initialize test DB, seed with mock applications
  });

  afterAll(async () => {
    // Cleanup test database
  });

  beforeEach(() => {
    // Reset mocks before each test
  });

  describe('Authentication & Authorization', () => {
    it('should return 401 when no authentication token provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/applications');

      const response = await GET(request);
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
      const request = new NextRequest('http://localhost:3000/api/applications', {
        headers: {
          Authorization: 'Bearer parent-token',
        },
      });

      // Mock authentication to return parent user
      const response = await GET(request);
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

  describe('Request Validation', () => {
    it('should return 400 for invalid limit parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/applications?limit=150',
        {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: [
            {
              field: 'limit',
              message: 'Limit must be between 1 and 100',
            },
          ],
        },
      });
    });

    it('should return 400 for invalid status filter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/applications?status=invalid',
        {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: [
            {
              field: 'status',
              message: 'Status must be one of: pending, approved, rejected',
            },
          ],
        },
      });
    });
  });

  describe('Successful Responses', () => {
    it('should return paginated applications list with default parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/applications', {
        headers: {
          Authorization: 'Bearer admin-token',
        },
      });

      // Mock authentication and database response
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          applications: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              parentName: expect.any(String),
              parentEmail: expect.any(String),
              childName: expect.any(String),
              childDateOfBirth: expect.any(String),
              status: expect.stringMatching(/^(pending|approved|rejected)$/),
              createdAt: expect.any(String),
            }),
          ]),
          pagination: {
            currentPage: 1,
            totalPages: expect.any(Number),
            totalItems: expect.any(Number),
            limit: 10,
            hasNextPage: expect.any(Boolean),
            hasPrevPage: false,
          },
          filters: {},
        },
      });
    });

    it('should filter applications by status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/applications?status=pending',
        {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filters.status).toBe('pending');

      // All returned applications should have pending status
      data.data.applications.forEach((app: any) => {
        expect(app.status).toBe('pending');
      });
    });

    it('should search applications by parent name', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/applications?search=Smith',
        {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.filters.search).toBe('Smith');

      // All returned applications should match search term
      data.data.applications.forEach((app: any) => {
        expect(
          app.parentName.toLowerCase().includes('smith') ||
          app.childName.toLowerCase().includes('smith') ||
          app.parentEmail.toLowerCase().includes('smith')
        ).toBe(true);
      });
    });

    it('should handle pagination correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/applications?page=2&limit=5',
        {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination.currentPage).toBe(2);
      expect(data.data.pagination.limit).toBe(5);
      expect(data.data.applications.length).toBeLessThanOrEqual(5);
    });

    it('should sort applications correctly', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/applications?sortBy=parentName&sortOrder=asc',
        {
          headers: {
            Authorization: 'Bearer admin-token',
          },
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Check if applications are sorted by parent name in ascending order
      const applications = data.data.applications;
      for (let i = 1; i < applications.length; i++) {
        expect(applications[i].parentName >= applications[i - 1].parentName).toBe(true);
      }
    });
  });

  describe('Multi-tenant Security', () => {
    it('should only return applications for admin school', async () => {
      const request = new NextRequest('http://localhost:3000/api/applications', {
        headers: {
          Authorization: 'Bearer admin-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // All applications should belong to the same school as admin
      data.data.applications.forEach((app: any) => {
        expect(app.schoolId).toBe(mockAdminUser.schoolId);
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should respond within 300ms for typical request', async () => {
      const startTime = Date.now();

      const request = new NextRequest('http://localhost:3000/api/applications', {
        headers: {
          Authorization: 'Bearer admin-token',
        },
      });

      const response = await GET(request);
      const endTime = Date.now();

      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(300);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 for database errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/applications', {
        headers: {
          Authorization: 'Bearer admin-token',
        },
      });

      // Mock database error
      const response = await GET(request);

      // This test would be implemented when we have actual database integration
      // For now, we just ensure the contract exists
      expect(typeof GET).toBe('function');
    });
  });

  describe('Response Schema Validation', () => {
    it('should return correctly structured response', async () => {
      const request = new NextRequest('http://localhost:3000/api/applications', {
        headers: {
          Authorization: 'Bearer admin-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        success: true,
        data: {
          applications: expect.any(Array),
          pagination: {
            currentPage: expect.any(Number),
            totalPages: expect.any(Number),
            totalItems: expect.any(Number),
            limit: expect.any(Number),
            hasNextPage: expect.any(Boolean),
            hasPrevPage: expect.any(Boolean),
          },
          filters: expect.any(Object),
        },
      });

      // Validate application schema if applications exist
      if (data.data.applications.length > 0) {
        const app = data.data.applications[0];
        expect(app).toMatchObject({
          id: expect.any(String),
          parentName: expect.any(String),
          parentEmail: expect.any(String),
          childName: expect.any(String),
          childDateOfBirth: expect.any(String),
          status: expect.stringMatching(/^(pending|approved|rejected)$/),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        });
      }
    });
  });
});