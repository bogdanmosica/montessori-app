/**
 * Excel File Upload and Validation API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseExcelFile } from '@/lib/utils/excel/parser';
import { validateImportData } from '@/lib/utils/excel/validator';
import { logImportErrors } from '@/lib/services/import-error-service';
import {
  IMPORT_CONSTANTS,
  IMPORT_MESSAGES,
  ENTITY_TYPES,
  EntityType,
} from '@/lib/constants/import-constants';
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as EntityType;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: IMPORT_MESSAGES.FILE_REQUIRED },
        { status: 400 }
      );
    }

    if (!entityType || !Object.values(ENTITY_TYPES).includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!IMPORT_CONSTANTS.ALLOWED_FILE_TYPES.includes(fileExtension)) {
      return NextResponse.json(
        { error: IMPORT_MESSAGES.INVALID_FILE_TYPE },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > IMPORT_CONSTANTS.MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: IMPORT_MESSAGES.FILE_TOO_LARGE },
        { status: 400 }
      );
    }

    // Parse Excel file
    const buffer = Buffer.from(await file.arrayBuffer());
    const { rows } = parseExcelFile(buffer);

    // Validate data
    const validationResult = validateImportData(rows, entityType);

    // Log errors if any
    if (validationResult.errors.length > 0) {
      await logImportErrors(
        schoolId,
        entityType,
        validationResult.errors,
        rows
      );
    }

    return NextResponse.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('Upload error:', error);
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
