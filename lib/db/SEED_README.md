# Database Seeding

This document explains the database seeding strategy and how to use it.

## Overview

The Montessori App uses an **idempotent seeding strategy**, meaning you can run the seed script multiple times without errors or duplicate data.

## Seed Scripts

### Primary Seed (Idempotent) ✅ Recommended
```bash
pnpm db:seed
```

- **File**: `lib/db/seed-idempotent.ts`
- **Safe to run multiple times**: YES ✅
- **Checks for existing data**: YES ✅
- **Use case**: Development, testing, CI/CD

This script:
1. Checks if data already exists before inserting
2. Uses `.onConflictDoNothing()` for conflict resolution
3. Provides clear progress feedback
4. Never fails if data already exists

### Original Seed (Non-Idempotent)
```bash
pnpm db:seed:original
```

- **File**: `lib/db/seed.ts`
- **Safe to run multiple times**: NO ❌
- **Checks for existing data**: NO ❌
- **Use case**: Fresh database only

This script will fail if run on a database that already has seed data.

## What Gets Seeded

The idempotent seed creates:

### 1. School ✓
- One test Montessori school with:
  - Age group capacities
  - Sibling discount rules
  - Fee structure

### 2. Test Users ✓
- **Admin**: `admin@test.com` / `admin123`
- **Teacher**: `teacher@test.com` / `teacher123`
- **Parent**: `parent@test.com` / `parent123`

### 3. Stripe Products ✓ (Optional)
- Base plan ($8/month)
- Plus plan ($12/month)
- Skips if Stripe is not configured

### 4. Sample Data ✓
- Families with children
- Student enrollments
- Teacher assignments
- Applications
- Payment records
- Activity logs

### 5. Progress Columns ✓
- Not Started (red)
- In Progress (amber)
- Completed (green)
- On Hold (gray)

### 6. Default Lessons ✓ (16 lessons)
- **Practical Life** (3 lessons)
- **Sensorial** (3 lessons)
- **Language** (3 lessons)
- **Mathematics** (3 lessons)
- **Cultural Studies** (2 lessons)
- **Creative Arts** (2 lessons)

All lessons are marked as `admin_global` visibility.

## Running Seeds

### First Time Setup
```bash
# Run migrations first
pnpm db:migrate

# Then seed
pnpm db:seed
```

### Re-seeding
```bash
# Simply run seed again - it will skip existing data
pnpm db:seed
```

### Fresh Start
```bash
# Drop and recreate database
pnpm db:setup

# Run migrations
pnpm db:migrate

# Seed data
pnpm db:seed
```

## Seed Output

Successful run shows:
```
============================================================
Starting IDEMPOTENT seed process...
============================================================

[1/6] ✓ School already exists
[2/6] Ensuring test users exist...
  ✓ Admin user exists
  ✓ Teacher user exists
  ✓ Parent user exists
[3/6] Assigning users to school...
✓ School members assigned
[4/6] Setting up Stripe products...
✓ Stripe products already exist, skipping...
[5/6] Seeding dashboard data...
✓ Dashboard data already exists, skipping...
[6/6] Seeding progress columns and lessons...
✓ Lessons already exist, skipping...

============================================================
✅ SEED COMPLETED SUCCESSFULLY
============================================================
```

## How Idempotency Works

### Check-Before-Insert Pattern
```typescript
// Example from seed-idempotent.ts
let school = await db.query.schools.findFirst();

if (!school) {
  // Only insert if doesn't exist
  const [newSchool] = await db.insert(schools).values({...});
  school = newSchool;
} else {
  console.log('✓ School already exists');
}
```

### Conflict Resolution
```typescript
// Use onConflictDoNothing() for duplicate prevention
await db
  .insert(schoolMembers)
  .values([...])
  .onConflictDoNothing();
```

### Data Existence Checks
```typescript
// Check if data exists before seeding
const existingLessons = await db
  .select()
  .from(lessons)
  .where(eq(lessons.schoolId, schoolId))
  .limit(1);

if (existingLessons.length > 0) {
  console.log('✓ Lessons already exist, skipping...');
  return;
}
```

## Adding New Seed Data

When adding new seed data, always follow the idempotent pattern:

1. Check if data exists
2. Only insert if missing
3. Use `.onConflictDoNothing()` where appropriate
4. Provide clear console feedback

Example:
```typescript
async function seedMyNewData(schoolId: number) {
  // Check first
  const existing = await db
    .select()
    .from(myTable)
    .where(eq(myTable.schoolId, schoolId))
    .limit(1);

  if (existing.length > 0) {
    console.log('✓ My data already exists, skipping...');
    return;
  }

  console.log('Seeding my new data...');
  // Insert data here
  console.log('✓ My data seeded');
}
```

## Troubleshooting

### Seed fails with "already exists" error
- You're likely using `db:seed:original` instead of `db:seed`
- Switch to: `pnpm db:seed`

### Want to re-seed everything from scratch
```bash
# WARNING: This deletes all data!
pnpm db:setup  # Drops and recreates database
pnpm db:migrate
pnpm db:seed
```

### Stripe product creation fails
- This is normal if Stripe is not configured
- The seed will continue successfully
- Only affects Stripe-related features

## Best Practices

1. ✅ **Always use `pnpm db:seed`** (idempotent version)
2. ✅ **Run after migrations** to ensure schema is up-to-date
3. ✅ **Safe for CI/CD pipelines** - won't fail on existing data
4. ✅ **Add new seed data idempotently** - follow the patterns shown
5. ❌ **Don't use `db:seed:original`** unless starting fresh

## Related Scripts

- `pnpm db:setup` - Drop and recreate database
- `pnpm db:migrate` - Run Drizzle migrations
- `pnpm db:generate` - Generate migration files
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

---

**Last Updated**: 2025-10-05
**Maintainer**: Development Team
