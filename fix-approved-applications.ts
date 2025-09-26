import { db } from './lib/db/drizzle';
import { applications } from './lib/db/schema';
import { eq } from 'drizzle-orm';
import { approveApplication } from './lib/services/application-processing';

async function processApprovedApplications() {
  console.log('🔍 Finding APPROVED applications that need child records created...');

  // Find all APPROVED applications
  const approvedApps = await db
    .select()
    .from(applications)
    .where(eq(applications.status, 'APPROVED'));

  console.log(`Found ${approvedApps.length} approved applications`);

  for (const app of approvedApps) {
    console.log(`\n📝 Processing: ${app.childFirstName} ${app.childLastName}`);
    
    try {
      // First, set the application back to PENDING so we can approve it properly
      await db
        .update(applications)
        .set({
          status: 'PENDING',
          processedAt: null,
          processedByAdminId: null,
        })
        .where(eq(applications.id, app.id));

      console.log(`   ✅ Reset ${app.childFirstName} to PENDING`);

      // Now properly approve it, which will create the child record
      const result = await approveApplication(
        app.id,
        1, // Admin user ID (from seed data)
        app.schoolId
      );

      console.log(`   ✅ Properly approved ${app.childFirstName}`);
      console.log(`   👶 Created child record: ${result.child_profile.id}`);
      console.log(`   👨‍👩‍👧 Created ${result.parent_profiles.length} parent record(s)`);

    } catch (error) {
      console.error(`   ❌ Error processing ${app.childFirstName}:`, error);
    }
  }

  console.log('\n🎉 Application processing complete!');
}

processApprovedApplications()
  .catch((error) => {
    console.error('❌ Failed to process applications:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });