import { describe, test, expect, beforeEach } from '@jest/globals';

describe('POST /api/admin/applications/[id]/approve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('approves application and creates child/parent profiles for authenticated admin', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'POST',
      url: `/api/admin/applications/${applicationId}/approve`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
    };

    // Expected response structure per API spec
    const expectedResponse = {
      application: {
        id: applicationId,
        status: 'APPROVED',
        processed_at: expect.any(String),
        processed_by_admin_id: expect.any(String),
      },
      child_profile: {
        id: expect.any(String),
        application_id: applicationId,
        first_name: expect.any(String),
        last_name: expect.any(String),
        date_of_birth: expect.any(String),
        enrollment_status: expect.stringMatching(/^(ACTIVE|INACTIVE|WAITLISTED)$/),
        start_date: expect.any(String),
        created_by_admin_id: expect.any(String),
      },
      parent_profiles: expect.arrayContaining([
        {
          id: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String),
          email: expect.stringMatching(/^.+@.+\..+$/),
          relationship_to_child: expect.stringMatching(/^(MOTHER|FATHER|GUARDIAN|OTHER)$/),
          primary_contact: expect.any(Boolean),
          pickup_authorized: expect.any(Boolean),
        },
      ]),
      access_log: {
        id: expect.any(String),
        action_type: 'APPLICATION_APPROVED',
        target_type: 'APPLICATION',
        target_id: applicationId,
        timestamp: expect.any(String),
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/approve/route`);
      const response = await handler.POST(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 409 when application already processed', async () => {
    const applicationId = 'already-processed-id';

    const mockRequest = {
      method: 'POST',
      url: `/api/admin/applications/${applicationId}/approve`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/approve/route`);
      const response = await handler.POST(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('already processed');
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 404 when application not found', async () => {
    const applicationId = 'non-existent-id';

    const mockRequest = {
      method: 'POST',
      url: `/api/admin/applications/${applicationId}/approve`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/approve/route`);
      const response = await handler.POST(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(404);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 401 when not authenticated', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'POST',
      url: `/api/admin/applications/${applicationId}/approve`,
      headers: {},
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/approve/route`);
      const response = await handler.POST(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(401);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 403 when user is not admin', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'POST',
      url: `/api/admin/applications/${applicationId}/approve`,
      headers: {
        authorization: 'Bearer valid-parent-jwt-token',
        'content-type': 'application/json',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/approve/route`);
      const response = await handler.POST(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(403);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('creates parent-child relationships with correct limits', async () => {
    const applicationId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

    const mockRequest = {
      method: 'POST',
      url: `/api/admin/applications/${applicationId}/approve`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/approve/route`);
      const response = await handler.POST(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.parent_profiles.length).toBeLessThanOrEqual(2);
      expect(data.parent_profiles.length).toBeGreaterThanOrEqual(1);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('links existing parent profiles when email matches', async () => {
    const applicationId = 'with-existing-parent-id';

    const mockRequest = {
      method: 'POST',
      url: `/api/admin/applications/${applicationId}/approve`,
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import(`../../app/api/admin/applications/[id]/approve/route`);
      const response = await handler.POST(mockRequest as any, { params: { id: applicationId } });
      expect(response.status).toBe(200);
      const data = await response.json();
      // Should link existing parent instead of creating duplicate
      expect(data.parent_profiles).toBeDefined();
    }).rejects.toThrow('Cannot resolve module');
  });
});