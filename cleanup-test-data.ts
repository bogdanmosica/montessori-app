import { db } from './lib/db/drizzle';
import { children, parentProfiles, parentChildRelationships } from './lib/db/schema';
import { eq } from 'drizzle-orm';

async function cleanupTestChildren() {
  console.log('🔍 Fetching all children in the database...');
  
  // Get all children
  const allChildren = await db
    .select({
      id: children.id,
      firstName: children.firstName,
      lastName: children.lastName,
      dateOfBirth: children.dateOfBirth,
      createdAt: children.createdAt,
    })
    .from(children)
    .orderBy(children.createdAt);

  console.log(`\nFound ${allChildren.length} children:`);
  allChildren.forEach((child, index) => {
    console.log(`${index + 1}. ${child.firstName} ${child.lastName} (Born: ${child.dateOfBirth.toISOString().split('T')[0]}, Created: ${child.createdAt.toISOString()})`);
  });

  // Identify test children (likely the ones with TestChild names or created today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const testChildren = allChildren.filter(child => 
    child.firstName.includes('Test') || 
    child.lastName.includes('Test') ||
    child.createdAt >= today
  );

  if (testChildren.length === 0) {
    console.log('\n✅ No test children found to remove.');
    return;
  }

  console.log(`\n🎯 Found ${testChildren.length} test children to remove:`);
  testChildren.forEach((child, index) => {
    console.log(`${index + 1}. ${child.firstName} ${child.lastName} (ID: ${child.id})`);
  });

  console.log('\n🗑️ Removing test children and their relationships...');

  for (const child of testChildren) {
    // Remove parent-child relationships
    await db.delete(parentChildRelationships).where(eq(parentChildRelationships.childId, child.id));
    console.log(`  ✓ Removed relationships for ${child.firstName} ${child.lastName}`);

    // Remove the child
    await db.delete(children).where(eq(children.id, child.id));
    console.log(`  ✓ Removed child ${child.firstName} ${child.lastName}`);
  }

  // Also check for orphaned parent profiles (parents with no children)
  console.log('\n🔍 Checking for orphaned parent profiles...');
  const allParents = await db.select().from(parentProfiles);
  
  for (const parent of allParents) {
    const relationships = await db
      .select()
      .from(parentChildRelationships)
      .where(eq(parentChildRelationships.parentId, parent.id));

    if (relationships.length === 0) {
      console.log(`  🗑️ Removing orphaned parent: ${parent.firstName} ${parent.lastName}`);
      await db.delete(parentProfiles).where(eq(parentProfiles.id, parent.id));
    }
  }

  console.log('\n✅ Cleanup completed!');
}

cleanupTestChildren().catch(console.error);