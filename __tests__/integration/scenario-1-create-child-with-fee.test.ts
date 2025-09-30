import { test, expect } from '@playwright/test';

test.describe('Integration Test - Scenario 1: Create Child with Monthly Fee', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as admin user
    await page.goto('/admin/login');
    
    // Fill login form (adjust selectors based on actual form)
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for successful login redirect
    await page.waitForURL('/admin/dashboard', { timeout: 10000 });
  });

  test('should create child with monthly fee via enrollment form', async ({ page }) => {
    // Navigate to enrollment creation page
    await page.goto('/admin/enrollments/new');
    await page.waitForLoadState('networkidle');

    // Fill required child information
    await page.fill('[data-testid="child-first-name"]', 'Maria');
    await page.fill('[data-testid="child-last-name"]', 'Popescu');
    await page.fill('[data-testid="child-date-of-birth"]', '2018-06-15');
    await page.fill('[data-testid="start-date"]', '2025-09-01');

    // Set monthly fee
    await page.fill('[data-testid="monthly-fee-input"]', '1500');

    // Fill any other required fields (parent info, etc.)
    await page.fill('[data-testid="parent-first-name"]', 'Ana');
    await page.fill('[data-testid="parent-last-name"]', 'Popescu');
    await page.fill('[data-testid="parent-email"]', 'ana@example.com');
    await page.selectOption('[data-testid="parent-relationship"]', 'MOTHER');

    // Submit form
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/admin/children') && response.request().method() === 'POST'
    );
    
    await page.click('[data-testid="submit-button"]');
    
    // Wait for API response
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    
    const responseData = await response.json();
    expect(responseData.monthlyFee).toBe(150000); // 1500 RON in cents
    expect(responseData.monthlyFeeDisplay).toBe('1,500 RON');

    // Verify success message or redirect
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 5000 });
    
    // Navigate to child details page
    const childId = responseData.id;
    await page.goto(`/admin/children/${childId}`);
    
    // Verify child details display correct fee
    await expect(page.locator('[data-testid="child-monthly-fee"]')).toContainText('1,500 RON');
  });

  test('should verify database stores fee correctly', async ({ page }) => {
    // This test uses the API directly to verify database state
    const createResponse = await page.request.post('/api/admin/children', {
      data: {
        firstName: 'Maria',
        lastName: 'Popescu',
        dateOfBirth: '2018-06-15T00:00:00Z',
        startDate: '2025-09-01T00:00:00Z',
        monthlyFee: 1500,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(createResponse.status()).toBe(201);
    const childData = await createResponse.json();
    
    // Verify database storage (monthlyFee stored in cents)
    expect(childData.monthlyFee).toBe(150000);
    
    // Verify display formatting
    expect(childData.monthlyFeeDisplay).toBe('1,500 RON');
    
    // Verify child details via GET request
    const getResponse = await page.request.get(`/api/admin/children/${childData.id}`);
    expect(getResponse.status()).toBe(200);
    
    const retrievedChild = await getResponse.json();
    expect(retrievedChild.monthlyFee).toBe(150000);
    expect(retrievedChild.firstName).toBe('Maria');
    expect(retrievedChild.lastName).toBe('Popescu');
  });

  test('should create access log entry for child creation', async ({ page }) => {
    // Create child via API
    const createResponse = await page.request.post('/api/admin/children', {
      data: {
        firstName: 'Maria',
        lastName: 'Popescu',
        dateOfBirth: '2018-06-15T00:00:00Z',
        startDate: '2025-09-01T00:00:00Z',
        monthlyFee: 1500,
      },
    });

    expect(createResponse.status()).toBe(201);
    const childData = await createResponse.json();

    // Check access logs for CHILD_CREATED action
    const logsResponse = await page.request.get('/api/admin/access-logs?action=CHILD_CREATED');
    expect(logsResponse.status()).toBe(200);
    
    const logs = await logsResponse.json();
    
    // Find the log entry for our created child
    const childCreationLog = logs.find((log: any) => 
      log.actionType === 'CHILD_CREATED' && 
      log.targetId === childData.id
    );
    
    expect(childCreationLog).toBeTruthy();
    expect(childCreationLog.targetType).toBe('CHILD');
  });

  test('should handle form validation for fee input', async ({ page }) => {
    await page.goto('/admin/enrollments/new');
    await page.waitForLoadState('networkidle');

    // Fill basic child info
    await page.fill('[data-testid="child-first-name"]', 'Test');
    await page.fill('[data-testid="child-last-name"]', 'Child');
    await page.fill('[data-testid="child-date-of-birth"]', '2018-06-15');
    await page.fill('[data-testid="start-date"]', '2025-09-01');

    // Try negative fee
    await page.fill('[data-testid="monthly-fee-input"]', '-100');
    await page.click('[data-testid="submit-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="fee-error"]')).toContainText('Fee cannot be negative');

    // Try excessive fee
    await page.fill('[data-testid="monthly-fee-input"]', '15000');
    await page.click('[data-testid="submit-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="fee-error"]')).toContainText('Fee cannot exceed 10,000 RON');

    // Valid fee should clear errors
    await page.fill('[data-testid="monthly-fee-input"]', '1500');
    await expect(page.locator('[data-testid="fee-error"]')).not.toBeVisible();
  });

  test('should verify performance target (<200ms response time)', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.request.post('/api/admin/children', {
      data: {
        firstName: 'Performance',
        lastName: 'Test',
        dateOfBirth: '2018-06-15T00:00:00Z',
        startDate: '2025-09-01T00:00:00Z',
        monthlyFee: 1500,
      },
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    expect(response.status()).toBe(201);
    expect(responseTime).toBeLessThan(200); // Performance target
  });
});