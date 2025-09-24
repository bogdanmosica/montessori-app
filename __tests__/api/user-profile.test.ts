/**
 * Contract test for GET /api/users/me endpoint
 * This test MUST FAIL until the endpoint is implemented (TDD)
 */

describe('GET /api/users/me', () => {
  it('should return current user profile with role when authenticated', async () => {
    // This test will fail until the API endpoint is implemented
    const response = await fetch('/api/users/me', {
      headers: {
        // Mock authenticated session cookie would be here
      }
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({
      id: expect.any(String),
      email: expect.any(String),
      name: expect.any(String),
      role: expect.stringMatching(/^(parent|teacher|admin)$/),
      teamId: expect.any(String),
      sessionVersion: expect.any(Number)
    });
  });

  it('should return 401 when not authenticated', async () => {
    const response = await fetch('/api/users/me');

    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe('UNAUTHENTICATED');
  });

  it('should include role in user profile data', async () => {
    const response = await fetch('/api/users/me', {
      headers: {
        // Mock authenticated session cookie for parent user
      }
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.role).toBe('parent'); // Assuming default role
    expect(['parent', 'teacher', 'admin']).toContain(data.data.role);
  });
});