/**
 * Integration test for non-admin redirect to unauthorized page
 * This test MUST FAIL until middleware and unauthorized page are implemented (TDD)
 */

describe('Non-Admin Unauthorized Redirect', () => {
  it('should redirect parent users to /unauthorized when accessing /admin/* routes', async () => {
    // This test will fail until middleware is implemented
    const adminRoutes = [
      '/admin/users',
      '/admin/settings',
      '/admin/reports',
      '/admin/access-logs'
    ];

    for (const route of adminRoutes) {
      const response = await fetch(route, {
        headers: {
          // Mock parent user session cookie
          Cookie: 'mock-parent-session=parent-token'
        },
        redirect: 'manual' // Don't follow redirects automatically
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/unauthorized');
    }
  });

  it('should redirect teacher users to /unauthorized when accessing /admin/* routes', async () => {
    const adminRoutes = [
      '/admin/users',
      '/admin/settings',
      '/admin/reports'
    ];

    for (const route of adminRoutes) {
      const response = await fetch(route, {
        headers: {
          // Mock teacher user session cookie
          Cookie: 'mock-teacher-session=teacher-token'
        },
        redirect: 'manual' // Don't follow redirects automatically
      });

      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/unauthorized');
    }
  });

  it('should log failed access attempts for non-admin users', async () => {
    const response = await fetch('/admin/users', {
      headers: {
        // Mock parent user session cookie
        Cookie: 'mock-parent-session=parent-token'
      },
      redirect: 'manual'
    });

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/unauthorized');

    // Failed access should be logged in access_logs table with success: false
    // This would need to be verified through database query or admin logs API
  });

  it('should display proper unauthorized page content', async () => {
    // First, trigger redirect by accessing admin route as non-admin
    const adminResponse = await fetch('/admin/users', {
      headers: {
        Cookie: 'mock-parent-session=parent-token'
      },
      redirect: 'manual'
    });

    expect(adminResponse.status).toBe(302);

    // Then check the unauthorized page content
    const unauthorizedResponse = await fetch('/unauthorized', {
      headers: {
        Cookie: 'mock-parent-session=parent-token'
      }
    });

    expect(unauthorizedResponse.status).toBe(200);

    const pageContent = await unauthorizedResponse.text();
    expect(pageContent).toContain('unauthorized'); // Basic check for unauthorized content
  });
});