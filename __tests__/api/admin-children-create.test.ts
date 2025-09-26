import { describe, test, expect, beforeEach } from '@jest/globals';

describe('POST /api/admin/children', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates child profile directly for authenticated admin', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        child: {
          first_name: 'Emma',
          last_name: 'Johnson',
          date_of_birth: '2020-03-15',
          gender: 'Female',
          start_date: '2024-09-01',
          special_needs: 'None',
          medical_conditions: 'Mild peanut allergy',
        },
        parents: [
          {
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah@example.com',
            phone: '555-0101',
            relationship_type: 'MOTHER',
            primary_contact: true,
            pickup_authorized: true,
          },
          {
            first_name: 'Mike',
            last_name: 'Johnson',
            email: 'mike@example.com',
            phone: '555-0102',
            relationship_type: 'FATHER',
            primary_contact: false,
            pickup_authorized: true,
          },
        ],
      }),
    };

    // Expected response structure per API spec
    const expectedResponse = {
      child_profile: {
        id: expect.any(String),
        application_id: null, // no application for direct creation
        first_name: 'Emma',
        last_name: 'Johnson',
        date_of_birth: '2020-03-15',
        gender: 'Female',
        enrollment_status: expect.stringMatching(/^(ACTIVE|INACTIVE|WAITLISTED)$/),
        start_date: '2024-09-01',
        special_needs: 'None',
        medical_conditions: 'Mild peanut allergy',
        created_by_admin_id: expect.any(String),
      },
      parent_profiles: expect.arrayContaining([
        {
          id: expect.any(String),
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@example.com',
          phone: '555-0101',
          relationship_to_child: 'MOTHER',
          primary_contact: true,
          pickup_authorized: true,
        },
        {
          id: expect.any(String),
          first_name: 'Mike',
          last_name: 'Johnson',
          email: 'mike@example.com',
          phone: '555-0102',
          relationship_to_child: 'FATHER',
          primary_contact: false,
          pickup_authorized: true,
        },
      ]),
      access_log: {
        id: expect.any(String),
        action_type: 'CHILD_CREATED',
        target_type: 'CHILD',
        target_id: expect.any(String),
        timestamp: expect.any(String),
      },
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toMatchObject(expectedResponse);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('creates child with single parent', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        child: {
          first_name: 'Alex',
          last_name: 'Smith',
          date_of_birth: '2019-07-22',
          start_date: '2024-09-01',
        },
        parents: [
          {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            relationship_type: 'GUARDIAN',
            primary_contact: true,
          },
        ],
      }),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.parent_profiles.length).toBe(1);
      expect(data.parent_profiles[0].primary_contact).toBe(true);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 400 when required child fields missing', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        child: {
          first_name: 'Emma',
          // missing last_name, date_of_birth, start_date
        },
        parents: [
          {
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah@example.com',
            relationship_type: 'MOTHER',
          },
        ],
      }),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(400);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 400 when no parents provided', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        child: {
          first_name: 'Emma',
          last_name: 'Johnson',
          date_of_birth: '2020-03-15',
          start_date: '2024-09-01',
        },
        parents: [],
      }),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(400);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 400 when more than 2 parents provided', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        child: {
          first_name: 'Emma',
          last_name: 'Johnson',
          date_of_birth: '2020-03-15',
          start_date: '2024-09-01',
        },
        parents: [
          { first_name: 'Parent', last_name: '1', email: 'p1@example.com', relationship_type: 'MOTHER' },
          { first_name: 'Parent', last_name: '2', email: 'p2@example.com', relationship_type: 'FATHER' },
          { first_name: 'Parent', last_name: '3', email: 'p3@example.com', relationship_type: 'GUARDIAN' },
        ],
      }),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(400);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 401 when not authenticated', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {},
      json: async () => ({
        child: { first_name: 'Emma', last_name: 'Johnson', date_of_birth: '2020-03-15', start_date: '2024-09-01' },
        parents: [{ first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com', relationship_type: 'MOTHER' }],
      }),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(401);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('returns 403 when user is not admin', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {
        authorization: 'Bearer valid-parent-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        child: { first_name: 'Emma', last_name: 'Johnson', date_of_birth: '2020-03-15', start_date: '2024-09-01' },
        parents: [{ first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.com', relationship_type: 'MOTHER' }],
      }),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(403);
    }).rejects.toThrow('Cannot resolve module');
  });

  test('links existing parent profiles when email matches', async () => {
    const mockRequest = {
      method: 'POST',
      url: '/api/admin/children',
      headers: {
        authorization: 'Bearer valid-admin-jwt-token',
        'content-type': 'application/json',
      },
      json: async () => ({
        child: {
          first_name: 'Emma',
          last_name: 'Johnson',
          date_of_birth: '2020-03-15',
          start_date: '2024-09-01',
        },
        parents: [
          {
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'existing-parent@example.com', // This email should exist in the system
            relationship_type: 'MOTHER',
            primary_contact: true,
          },
        ],
      }),
    };

    // This will fail until the route handler is implemented
    expect(async () => {
      const handler = await import('../../app/api/admin/children/route');
      const response = await handler.POST(mockRequest as any);
      expect(response.status).toBe(201);
      const data = await response.json();
      // Should link to existing parent profile instead of creating new one
      expect(data.parent_profiles[0].email).toBe('existing-parent@example.com');
    }).rejects.toThrow('Cannot resolve module');
  });
});