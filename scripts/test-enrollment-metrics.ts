// Test script to verify enrollment metrics are updating correctly
import { chromium } from 'playwright';

async function testEnrollmentMetrics() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔍 Testing Enrollment Metrics...\n');

    // Navigate to sign-in page
    await page.goto('http://localhost:3000/sign-in');
    await page.waitForLoadState('networkidle');

    // Sign in as admin
    console.log('📝 Signing in as admin...');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 10000 });
    console.log('✅ Logged in successfully\n');

    // Wait for metrics to load
    await page.waitForTimeout(2000);

    // Take screenshot
    await page.screenshot({ path: '.playwright-mcp/enrollment-metrics-test.png', fullPage: true });
    console.log('📸 Screenshot saved\n');

    // Extract metrics from the page
    const pendingApplications = await page.locator('text=Pending Applications').locator('..').locator('div.text-2xl').textContent();
    const activeEnrollments = await page.locator('text=Active Enrollments').locator('..').locator('div.text-2xl').textContent();
    const capacityUtilization = await page.locator('text=Capacity Utilization').locator('..').locator('div.text-2xl').textContent();

    console.log('📊 METRICS FOUND:');
    console.log('   Pending Applications:', pendingApplications);
    console.log('   Active Enrollments:', activeEnrollments);
    console.log('   Capacity Utilization:', capacityUtilization);
    console.log('');

    // Check if Active Enrollments shows the correct value (should be 6)
    const enrollmentCount = parseInt(activeEnrollments?.trim() || '0');

    if (enrollmentCount === 6) {
      console.log('✅ SUCCESS: Active Enrollments metric is correct (6 students)');
    } else if (enrollmentCount === 0) {
      console.log('❌ FAILURE: Active Enrollments still shows 0 (expected 6)');
      console.log('   This means the metrics fix has not been applied yet.');
    } else {
      console.log(`⚠️  WARNING: Active Enrollments shows ${enrollmentCount} (expected 6)`);
    }

    // Navigate to Students page (formerly Applications)
    console.log('\n🔍 Checking Students page...');
    await page.click('text=Students');
    await page.waitForURL('**/admin/applications', { timeout: 5000 });
    await page.waitForTimeout(1000);

    // Check metrics on Students page
    const studentsPageMetrics = await page.locator('text=Active Enrollments').locator('..').locator('div.text-2xl').textContent();
    console.log('   Students Page - Active Enrollments:', studentsPageMetrics);

    await page.screenshot({ path: '.playwright-mcp/students-page-metrics-test.png', fullPage: true });
    console.log('   Screenshot saved\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: '.playwright-mcp/enrollment-metrics-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testEnrollmentMetrics().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
