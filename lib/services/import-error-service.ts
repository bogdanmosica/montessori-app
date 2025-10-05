/**
 * Import Error Logging Service
 */

import { db } from '@/lib/db';
import { importErrorLogs } from '@/lib/db/schema/import-errors';
import { ImportValidationError } from '@/lib/types/import-types';
import { EntityType } from '@/lib/constants/import-constants';

export async function logImportErrors(
  schoolId: number,
  entityType: EntityType,
  errors: ImportValidationError[],
  rowData: any[]
): Promise<void> {
  const errorLogs = errors.map((error) => ({
    schoolId,
    entityType,
    rowNumber: error.row,
    field: error.field,
    errorMessage: error.message,
    rowData: JSON.stringify(rowData[error.row - 2] || {}), // -2 for header row
  }));

  if (errorLogs.length > 0) {
    await db.insert(importErrorLogs).values(errorLogs);
  }
}
