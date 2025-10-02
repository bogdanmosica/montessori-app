/**
 * Backfill script to create missing parent-child relationships
 *
 * This script finds children without parent relationships and creates them
 * based on approved applications that created these children.
 */

import { db } from '../lib/db';
import { children, applications, parentProfiles, parentChildRelationships } from '../lib/db/schema';
import { eq, isNull, and, notInArray, sql } from 'drizzle-orm';
import { findOrCreateParentProfile } from '../lib/services/parent-profile-matching';

async function backfillParentRelationships() {
  console.log('🔍 Starting parent relationships backfill...\n');

  try {
    // Find all children without any parent relationships
    const childrenWithoutParents = await db
      .select({
        id: children.id,
        schoolId: children.schoolId,
        firstName: children.firstName,
        lastName: children.lastName,
        applicationId: children.applicationId,
      })
      .from(children)
      .leftJoin(parentChildRelationships, eq(parentChildRelationships.childId, children.id))
      .where(isNull(parentChildRelationships.id))
      .groupBy(children.id, children.schoolId, children.firstName, children.lastName, children.applicationId);

    console.log(`Found ${childrenWithoutParents.length} children without parent relationships\n`);

    if (childrenWithoutParents.length === 0) {
      console.log('✅ All children already have parent relationships!');
      return;
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process each child
    for (const child of childrenWithoutParents) {
      console.log(`\n📝 Processing child: ${child.firstName} ${child.lastName} (ID: ${child.id})`);

      try {
        // If child was created from an application, get parent info from there
        if (child.applicationId) {
          const [application] = await db
            .select()
            .from(applications)
            .where(eq(applications.id, child.applicationId))
            .limit(1);

          if (!application) {
            console.log(`   ⚠️  Application not found for child ${child.id}`);
            skipCount++;
            continue;
          }

          // Create relationships in transaction
          await db.transaction(async (tx) => {
            // Create/find parent 1
            const parent1 = await findOrCreateParentProfile(
              {
                schoolId: child.schoolId,
                firstName: application.parent1FirstName,
                lastName: application.parent1LastName,
                email: application.parent1Email,
                phone: application.parent1Phone,
              },
              tx
            );

            // Create parent 1 relationship
            await tx.insert(parentChildRelationships).values({
              schoolId: child.schoolId,
              parentId: parent1.id,
              childId: child.id,
              relationshipType: application.parent1Relationship || 'GUARDIAN',
              primaryContact: true,
              pickupAuthorized: true,
            });

            console.log(`   ✅ Created relationship with parent: ${parent1.firstName} ${parent1.lastName}`);

            // Create/find parent 2 if exists
            if (application.parent2FirstName && application.parent2Email) {
              const parent2 = await findOrCreateParentProfile(
                {
                  schoolId: child.schoolId,
                  firstName: application.parent2FirstName,
                  lastName: application.parent2LastName,
                  email: application.parent2Email,
                  phone: application.parent2Phone,
                },
                tx
              );

              await tx.insert(parentChildRelationships).values({
                schoolId: child.schoolId,
                parentId: parent2.id,
                childId: child.id,
                relationshipType: application.parent2Relationship || 'GUARDIAN',
                primaryContact: false,
                pickupAuthorized: true,
              });

              console.log(`   ✅ Created relationship with parent: ${parent2.firstName} ${parent2.lastName}`);
            }
          });

          successCount++;
        } else {
          // Child was created directly without application - skip
          console.log(`   ⚠️  Child created directly (no application). Manual intervention required.`);
          skipCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing child ${child.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Backfill Summary:');
    console.log(`   ✅ Successfully linked: ${successCount} children`);
    console.log(`   ⚠️  Skipped: ${skipCount} children (no application data)`);
    console.log(`   ❌ Errors: ${errorCount} children`);
    console.log('='.repeat(50));

    if (skipCount > 0) {
      console.log('\n⚠️  Note: Some children were created directly and need manual parent linking.');
      console.log('   You can add parents through the admin interface.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during backfill:', error);
    throw error;
  }
}

// Run the backfill
backfillParentRelationships()
  .then(() => {
    console.log('\n✅ Backfill completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Backfill failed:', error);
    process.exit(1);
  });
