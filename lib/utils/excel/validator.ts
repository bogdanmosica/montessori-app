/**
 * Excel Import Validator
 */

import {
  TeacherImportRow,
  ParentImportRow,
  ChildImportRow,
  ImportValidationError,
  ImportValidationResult,
} from '@/lib/types/import-types';
import { ENTITY_TYPES, EntityType } from '@/lib/constants/import-constants';
import { IMPORT_MESSAGES, IMPORT_CONSTANTS } from '@/lib/constants/import-constants';

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date < new Date();
}

function validateTeacherRow(row: any, rowIndex: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (!row.name || !row.name.trim()) {
    errors.push({
      row: rowIndex,
      field: 'name',
      message: IMPORT_MESSAGES.NAME_REQUIRED,
    });
  }

  if (!row.email || !row.email.trim()) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: IMPORT_MESSAGES.EMAIL_REQUIRED,
    });
  } else if (!isValidEmail(row.email)) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: IMPORT_MESSAGES.INVALID_EMAIL,
    });
  }

  if (row.wage && (isNaN(row.wage) || row.wage < 0)) {
    errors.push({
      row: rowIndex,
      field: 'wage',
      message: IMPORT_MESSAGES.INVALID_FEE,
    });
  }

  return errors;
}

function validateParentRow(row: any, rowIndex: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (!row.name || !row.name.trim()) {
    errors.push({
      row: rowIndex,
      field: 'name',
      message: IMPORT_MESSAGES.NAME_REQUIRED,
    });
  }

  if (!row.email || !row.email.trim()) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: IMPORT_MESSAGES.EMAIL_REQUIRED,
    });
  } else if (!isValidEmail(row.email)) {
    errors.push({
      row: rowIndex,
      field: 'email',
      message: IMPORT_MESSAGES.INVALID_EMAIL,
    });
  }

  return errors;
}

function validateChildRow(row: any, rowIndex: number): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  if (!row.firstName || !row.firstName.trim()) {
    errors.push({
      row: rowIndex,
      field: 'firstName',
      message: IMPORT_MESSAGES.REQUIRED_FIELD('First Name'),
    });
  }

  if (!row.lastName || !row.lastName.trim()) {
    errors.push({
      row: rowIndex,
      field: 'lastName',
      message: IMPORT_MESSAGES.REQUIRED_FIELD('Last Name'),
    });
  }

  if (!row.dob) {
    errors.push({
      row: rowIndex,
      field: 'dob',
      message: IMPORT_MESSAGES.DOB_REQUIRED,
    });
  } else if (!isValidDate(row.dob)) {
    errors.push({
      row: rowIndex,
      field: 'dob',
      message: IMPORT_MESSAGES.INVALID_DATE,
    });
  }

  if (!row.parent_email || !row.parent_email.trim()) {
    errors.push({
      row: rowIndex,
      field: 'parent_email',
      message: IMPORT_MESSAGES.PARENT_EMAIL_REQUIRED,
    });
  } else if (!isValidEmail(row.parent_email)) {
    errors.push({
      row: rowIndex,
      field: 'parent_email',
      message: IMPORT_MESSAGES.INVALID_EMAIL,
    });
  }

  if (!row.monthly_fee_RON) {
    errors.push({
      row: rowIndex,
      field: 'monthly_fee_RON',
      message: IMPORT_MESSAGES.MONTHLY_FEE_REQUIRED,
    });
  } else if (isNaN(row.monthly_fee_RON) || row.monthly_fee_RON < 0) {
    errors.push({
      row: rowIndex,
      field: 'monthly_fee_RON',
      message: IMPORT_MESSAGES.INVALID_FEE,
    });
  }

  if (!row.enrollment_status) {
    errors.push({
      row: rowIndex,
      field: 'enrollment_status',
      message: IMPORT_MESSAGES.REQUIRED_FIELD('Enrollment Status'),
    });
  } else if (!['ACTIVE', 'INACTIVE', 'WAITLISTED'].includes(row.enrollment_status)) {
    errors.push({
      row: rowIndex,
      field: 'enrollment_status',
      message: IMPORT_MESSAGES.INVALID_ENROLLMENT_STATUS,
    });
  }

  return errors;
}

export function validateImportData(
  rows: any[],
  entityType: EntityType
): ImportValidationResult {
  const allErrors: ImportValidationError[] = [];
  const validRows: any[] = [];

  rows.forEach((row, index) => {
    let rowErrors: ImportValidationError[] = [];

    switch (entityType) {
      case ENTITY_TYPES.TEACHER:
        rowErrors = validateTeacherRow(row, index + 2); // +2 for header row
        break;
      case ENTITY_TYPES.PARENT:
        rowErrors = validateParentRow(row, index + 2);
        break;
      case ENTITY_TYPES.CHILD:
        rowErrors = validateChildRow(row, index + 2);
        break;
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }

    if (rowErrors.length === 0) {
      validRows.push(row);
    } else {
      allErrors.push(...rowErrors);
    }
  });

  return {
    valid: allErrors.length === 0,
    validRows,
    errors: allErrors,
    totalRows: rows.length,
    validCount: validRows.length,
    errorCount: allErrors.length,
  };
}
