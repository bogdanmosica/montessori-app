/**
 * Import Confirmation API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchImport } from '@/lib/services/batch-import-service';
import { ENTITY_TYPES, EntityType } from '@/lib/constants/import-constants';
import { IMPORT_MESSAGES } from '@/lib/constants/import-constants';
import { verifyToken } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication using session cookie
    const sessionCookie = request.cookies.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await verifyToken(sessionCookie.value);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const schoolId = session.user.teamId;
    const adminUserId = session.user.id;

    // Parse request body
    const body = await request.json();
    const { entityType, validRows } = body;

    // Validate inputs
    if (!entityType || !Object.values(ENTITY_TYPES).includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows to import' },
        { status: 400 }
      );
    }

    // Perform batch import with multi-tenant scoping
    const result = await batchImport(
      entityType as EntityType,
      validRows,
      schoolId,
      adminUserId
    );

    return NextResponse.json({
      success: true,
      importedCount: result.importedCount,
      skippedCount: result.skippedCount,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Import confirmation error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : IMPORT_MESSAGES.IMPORT_FAILED,
      },
      { status: 500 }
    );
  }
}
