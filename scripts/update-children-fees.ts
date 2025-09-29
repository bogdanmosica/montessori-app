import { db } from '@/lib/db';
import { children, schoolSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function updateChildrenFees() {
  console.log('Updating children fees...');

  try {
    // Get school settings to get base fee
    const settings = await db
      .select()
      .from(schoolSettings)
      .where(eq(schoolSettings.schoolId, 1))
      .limit(1);

    if (settings.length === 0) {
      console.log('No school settings found, using default fee');
      const baseFee = 65000; // $650 in cents

      // Update all children with the base fee
      await db
        .update(children)
        .set({ monthlyFee: baseFee })
        .where(eq(children.schoolId, 1));

      console.log('✅ Updated all children with base fee of $650');
    } else {
      const baseFee = settings[0].baseFeePerChild;
      
      // Get all children for the school
      const allChildren = await db
        .select()
        .from(children)
        .where(eq(children.schoolId, 1))
        .orderBy(children.createdAt);

      console.log(`Found ${allChildren.length} children to update`);

      // Update each child with appropriate fee (with sibling discounts)
      for (let i = 0; i < allChildren.length; i++) {
        const child = allChildren[i];
        let fee = baseFee;

        // Apply sibling discount logic (simplified)
        // First child: full fee
        // Second child: 20% discount  
        // Third+ child: 30% discount
        if (i === 1) {
          fee = Math.floor(baseFee * 0.8); // 20% discount
        } else if (i >= 2) {
          fee = Math.floor(baseFee * 0.7); // 30% discount
        }

        await db
          .update(children)
          .set({ monthlyFee: fee })
          .where(eq(children.id, child.id));

        console.log(`Updated ${child.firstName} ${child.lastName}: $${(fee / 100).toFixed(2)}`);
      }

      console.log('✅ All children fees updated successfully!');
    }

    // Show final summary
    const updatedChildren = await db
      .select({
        firstName: children.firstName,
        lastName: children.lastName,
        monthlyFee: children.monthlyFee
      })
      .from(children)
      .where(eq(children.schoolId, 1))
      .orderBy(children.firstName);

    console.log('\n📊 Updated Children Fees:');
    let totalRevenue = 0;
    updatedChildren.forEach(child => {
      console.log(`  ${child.firstName} ${child.lastName}: $${(child.monthlyFee / 100).toFixed(2)}/month`);
      totalRevenue += child.monthlyFee;
    });
    
    console.log(`\n💰 Total Monthly Revenue: $${(totalRevenue / 100).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error updating children fees:', error);
  }
}

updateChildrenFees()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });