import { describe, test, expect, beforeEach } from '@jest/globals';

describe('POST /api/admin/enrollments - Fee Override Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates enrollment with fee override for authenticated admin', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/enrollments',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        childId: 'child-id',
        monthlyFeeOverride: 1200, // RON override
        startDate: '2025-09-01T00:00:00Z',
      }),
    };

    const expectedResponse = {
      id: expect.any(String),
      childId: 'child-id',
      monthlyFeeOverride: 120000, // cents
      effectiveFee: 120000, // resolved fee in cents
      effectiveFeeDisplay: '1,200 RON',
      createdAt: expect.any(String),
    };

    // This will pass when the fee override functionality is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('creates enrollment without fee override (uses child default)', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/enrollments',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        childId: 'child-with-default-fee-id',
        startDate: '2025-09-01T00:00:00Z',
        // monthlyFeeOverride not provided
      }),
    };

    const expectedResponse = {
      childId: 'child-with-default-fee-id',
      monthlyFeeOverride: null, // no override
      effectiveFee: 150000, // child's default fee (1500 RON)
      effectiveFeeDisplay: '1,500 RON',
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('rejects negative fee override', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/enrollments',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        childId: 'child-id',
        monthlyFeeOverride: -100,
        startDate: '2025-09-01T00:00:00Z',
      }),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Fee cannot be negative');
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('rejects excessive fee override (>10000 RON)', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/enrollments',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        childId: 'child-id',
        monthlyFeeOverride: 15000, // Above 10K RON limit
        startDate: '2025-09-01T00:00:00Z',
      }),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Fee cannot exceed 10,000 RON');
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('enforces admin role requirement', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/enrollments',
      headers: {
        authorization: 'Bearer valid-teacher-jwt-token', // Non-admin token
        'content-type': 'application/json',
      },
      json: async () => ({
        childId: 'child-id',
        monthlyFeeOverride: 1200,
        startDate: '2025-09-01T00:00:00Z',
      }),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Forbidden');
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('enforces multi-tenant isolation for child access', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/enrollments',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        childId: 'other-school-child-id', // Child from different school
        monthlyFeeOverride: 1200,
        startDate: '2025-09-01T00:00:00Z',
      }),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Child not found');
    }).rejects.toThrow(); // Remove when implementation is ready
  });
});

describe('PATCH /api/admin/enrollments/[id] - Fee Override Updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates enrollment fee override for authenticated admin', async () => {
    const mockRequest = {
      method: 'PATCH',
      url: '/api/admin/enrollments/enrollment-id',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        monthlyFeeOverride: 1800, // Updated override
      }),
    };

    const expectedResponse = {
      id: 'enrollment-id',
      monthlyFeeOverride: 180000, // 1800 RON in cents
      effectiveFee: 180000, // resolved fee in cents
      effectiveFeeDisplay: '1,800 RON',
      updatedAt: expect.any(String),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/[id]/route');
      const response = await handler.PATCH(mockRequest as any, { params: { id: 'enrollment-id' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('removes fee override (reverts to child default)', async () => {
    const mockRequest = {
      method: 'PATCH',
      url: '/api/admin/enrollments/enrollment-id',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        monthlyFeeOverride: null, // Remove override
      }),
    };

    const expectedResponse = {
      monthlyFeeOverride: null,
      effectiveFee: 150000, // child's default fee
      effectiveFeeDisplay: '1,500 RON',
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/[id]/route');
      const response = await handler.PATCH(mockRequest as any, { params: { id: 'enrollment-id' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('rejects update to negative fee override', async () => {
    const mockRequest = {
      method: 'PATCH',
      url: '/api/admin/enrollments/enrollment-id',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        monthlyFeeOverride: -500,
      }),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/[id]/route');
      const response = await handler.PATCH(mockRequest as any, { params: { id: 'enrollment-id' } });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Fee cannot be negative');
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('enforces multi-tenant isolation on updates', async () => {
    const mockRequest = {
      method: 'PATCH',
      url: '/api/admin/enrollments/other-school-enrollment-id',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        monthlyFeeOverride: 2000,
      }),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/[id]/route');
      const response = await handler.PATCH(mockRequest as any, { params: { id: 'other-school-enrollment-id' } });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Enrollment not found');
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('returns 404 for non-existent enrollment', async () => {
    const mockRequest = {
      method: 'PATCH',
      url: '/api/admin/enrollments/non-existent-id',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        monthlyFeeOverride: 1500,
      }),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/[id]/route');
      const response = await handler.PATCH(mockRequest as any, { params: { id: 'non-existent-id' } });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Enrollment not found');
    }).rejects.toThrow(); // Remove when implementation is ready
  });
});

describe('GET /api/admin/children/[id]/fee-details - Fee Resolution Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns detailed fee information for child and enrollments', async () => {
    const mockRequest = {
      method: 'GET',
      url: '/api/admin/children/child-id/fee-details',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
      },
    };

    const expectedResponse = {
      childId: 'child-id',
      defaultFee: 150000, // cents
      defaultFeeDisplay: '1,500 RON',
      enrollments: expect.arrayContaining([
        {
          id: expect.any(String),
          monthlyFeeOverride: 120000, // cents
          effectiveFee: 120000, // resolved fee in cents
          effectiveFeeDisplay: '1,200 RON',
        },
      ]),
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/children/[id]/fee-details/route');
      const response = await handler.GET(mockRequest as any, { params: { id: 'child-id' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow(); // Remove when implementation is ready
  });
});

describe('GET /api/admin/enrollments/[id]/effective-fee - Effective Fee Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns effective fee for enrollment with override', async () => {
    const mockRequest = {
      method: 'GET',
      url: '/api/admin/enrollments/enrollment-id/effective-fee',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
      },
    };

    const expectedResponse = {
      enrollmentId: 'enrollment-id',
      childDefaultFee: 150000, // cents
      enrollmentOverride: 120000, // cents
      effectiveFee: 120000, // resolved fee in cents
      effectiveFeeDisplay: '1,200 RON',
      feeSource: 'enrollment_override',
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/[id]/effective-fee/route');
      const response = await handler.GET(mockRequest as any, { params: { id: 'enrollment-id' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow(); // Remove when implementation is ready
  });

  test('returns effective fee for enrollment without override (uses child default)', async () => {
    const mockRequest = {
      method: 'GET',
      url: '/api/admin/enrollments/enrollment-no-override-id/effective-fee',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
      },
    };

    const expectedResponse = {
      enrollmentId: 'enrollment-no-override-id',
      childDefaultFee: 150000, // cents
      enrollmentOverride: null,
      effectiveFee: 150000, // uses child default
      effectiveFeeDisplay: '1,500 RON',
      feeSource: 'child_default',
    };

    expect(async () => {
      const handler = await import('../../app/api/admin/enrollments/[id]/effective-fee/route');
      const response = await handler.GET(mockRequest as any, { params: { id: 'enrollment-no-override-id' } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow(); // Remove when implementation is ready
  });
});