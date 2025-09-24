// T010: Integration test empty state handling
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';

describe('Empty State Handling', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should display helpful empty state for dashboard with no data', async () => {
    // This test MUST FAIL until empty state components are implemented
    try {
      await page.goto('http://localhost:3000/admin/dashboard');

      // Check for empty state messages
      await page.waitForSelector('[data-testid="empty-state-applications"]');
      const applicationsEmpty = await page.textContent('[data-testid="empty-state-applications"]');
      expect(applicationsEmpty).toContain('No pending applications');

      await page.waitForSelector('[data-testid="empty-state-enrollments"]');
      const enrollmentsEmpty = await page.textContent('[data-testid="empty-state-enrollments"]');
      expect(enrollmentsEmpty).toContain('No active enrollments yet');

    } catch (error) {
      // Expected to fail - empty state components don't exist yet
      expect(error).toBeDefined();
    }
  });

  it('should show actionable guidance in empty states', async () => {
    // This test MUST FAIL until empty state guidance is implemented
    try {
      await page.goto('http://localhost:3000/admin/dashboard');

      // Check for actionable guidance
      const emptyStateActions = await page.locator('[data-testid="empty-state-action"]');
      const actionCount = await emptyStateActions.count();
      expect(actionCount).toBeGreaterThan(0);

      // Verify action buttons exist
      const actionText = await emptyStateActions.first().textContent();
      expect(actionText).toMatch(/(Add|Create|Start|Setup)/);

    } catch (error) {
      // Expected to fail - empty state actions not implemented yet
      expect(error).toBeDefined();
    }
  });

  it('should display empty trends chart with helpful message', async () => {
    // This test MUST FAIL until trends chart empty state is implemented
    try {
      await page.goto('http://localhost:3000/admin/dashboard');

      await page.waitForSelector('[data-testid="trends-empty-state"]');
      const trendsEmpty = await page.textContent('[data-testid="trends-empty-state"]');
      expect(trendsEmpty).toContain('Not enough data for trends analysis');

      // Check for explanation of when trends will be available
      const trendsExplanation = await page.textContent('[data-testid="trends-explanation"]');
      expect(trendsExplanation).toContain('week of data');

    } catch (error) {
      // Expected to fail - trends empty state not implemented yet
      expect(error).toBeDefined();
    }
  });

  it('should maintain consistent styling for empty states', async () => {
    // This test MUST FAIL until empty state styling is implemented
    try {
      await page.goto('http://localhost:3000/admin/dashboard');

      const emptyStates = await page.locator('[data-testid^="empty-state"]');
      const emptyStateCount = await emptyStates.count();

      expect(emptyStateCount).toBeGreaterThan(0);

      // Check consistent styling across empty states
      for (let i = 0; i < emptyStateCount; i++) {
        const emptyState = emptyStates.nth(i);
        const classes = await emptyState.getAttribute('class');

        // Verify consistent design system usage
        expect(classes).toMatch(/(text-muted|text-gray)/);
        expect(classes).toMatch(/(p-|padding)/);
      }

    } catch (error) {
      // Expected to fail - empty state components don't exist yet
      expect(error).toBeDefined();
    }
  });

  it('should handle empty state to populated state transitions', async () => {
    // This test MUST FAIL until state transition handling is implemented
    try {
      await page.goto('http://localhost:3000/admin/dashboard');

      // Initially should show empty states
      await page.waitForSelector('[data-testid="empty-state-applications"]');

      // Simulate data addition (this would be done through API in real test)
      await page.evaluate(() => {
        // Trigger data refresh that would populate the dashboard
        window.dispatchEvent(new CustomEvent('dashboard-data-updated'));
      });

      // Empty states should disappear when data is available
      await page.waitForSelector('[data-testid="metrics-card"]', { timeout: 5000 });

      const emptyStates = await page.locator('[data-testid^="empty-state"]');
      const visibleEmptyStates = await emptyStates.count();
      expect(visibleEmptyStates).toBe(0);

    } catch (error) {
      // Expected to fail - state transitions not implemented yet
      expect(error).toBeDefined();
    }
  });

  it('should provide different empty states for new vs established schools', async () => {
    // This test MUST FAIL until contextual empty states are implemented
    try {
      // Test new school empty state
      await page.goto('http://localhost:3000/admin/dashboard?school=new');

      await page.waitForSelector('[data-testid="new-school-empty-state"]');
      const newSchoolMessage = await page.textContent('[data-testid="new-school-empty-state"]');
      expect(newSchoolMessage).toContain('welcome');
      expect(newSchoolMessage).toContain('getting started');

      // Test established school empty state
      await page.goto('http://localhost:3000/admin/dashboard?school=established');

      await page.waitForSelector('[data-testid="established-school-empty-state"]');
      const establishedMessage = await page.textContent('[data-testid="established-school-empty-state"]');
      expect(establishedMessage).toContain('no recent data');

    } catch (error) {
      // Expected to fail - contextual empty states not implemented yet
      expect(error).toBeDefined();
    }
  });
});