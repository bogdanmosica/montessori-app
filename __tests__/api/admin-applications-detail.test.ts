import { describe, test, expect, beforeEach } from '@jest/globals';

describe('GET /api/admin/applications/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns application detail for authenticated admin', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'GET',
      url: `/api/admin/applications/${applicationId}`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
      },
    };

    // Expected response structure per API spec
    const expectedResponse = {
      id: applicationId,
      status: expect.stringMatching(/^(PENDING|APPROVED|REJECTED)$/),
      child_first_name: expect.any(String),
      child_last_name: expect.any(String),
      child_date_of_birth: expect.any(String),
      child_gender: expect.any(String),
      preferred_start_date: expect.any(String),
      special_needs: expect.any(String),
      medical_conditions: expect.any(String),
      parent1_first_name: expect.any(String),
      parent1_last_name: expect.any(String),
      parent1_email: expect.stringMatching(/^.+@.+\..+$/),
      parent1_phone: expect.any(String),
      parent1_relationship: expect.stringMatching(/^(MOTHER|FATHER|GUARDIAN|OTHER)$/),
      parent2_first_name: expect.any(String),
      parent2_last_name: expect.any(String),
      parent2_email: expect.stringMatching(/^.+@.+\..+$/),
      parent2_phone: expect.any(String),
      parent2_relationship: expect.stringMatching(/^(MOTHER|FATHER|GUARDIAN|OTHER)$/),
      submitted_at: expect.any(String),
      processed_at: expect.any(String),
      processed_by_admin_id: expect.any(String),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/route`);
      const response = await handler.GET(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 404 when application not found', async () => {
    const applicationId = 'non-existent-id';

    const mockRequest = {
      method: 'GET',
      url: `/api/admin/applications/${applicationId}`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/route`);
      const response = await handler.GET(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(404);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 401 when not authenticated', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'GET',
      url: `/api/admin/applications/${applicationId}`,
      headers: {},
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/route`);
      const response = await handler.GET(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(401);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 403 when user is not admin', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'GET',
      url: `/api/admin/applications/${applicationId}`,
      headers: {
        authorization: 'Bearer valid-parent-jwt-token',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/route`);
      const response = await handler.GET(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(403);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 403 when accessing application from different tenant', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'GET',
      url: `/api/admin/applications/${applicationId}`,
      headers: {
        authorization: 'Bearer valid-admin-different-school-token',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/route`);
      const response = await handler.GET(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(403);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('validates UUID format for application ID', async () => {
    const invalidId = 'invalid-uuid-format';

    const mockRequest = {
      method: 'GET',
      url: `/api/admin/applications/${invalidId}`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/route`);
      const response = await handler.GET(mockRequest as any, { params: { id: invalidId } });
      expect(response.status).toBe(400);
    }).rejects.toThrow('Cannot resolve module');
  });
});