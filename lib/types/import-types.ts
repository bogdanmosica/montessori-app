/**
 * Import Feature Type Definitions
 */

import { EntityType, ImportStatus } from '../constants/import-constants';

export interface TeacherImportRow {
  name: string;
  email: string;
  role?: string;
  wage?: number;
  nationality?: string;
}

export interface ParentImportRow {
  name: string;
  email: string;
  phone?: string;
  children_names?: string;
}

export interface ChildImportRow {
  firstName: string;
  lastName: string;
  dob: string;
  parent_email: string;
  monthly_fee_RON: number;
  enrollment_status: string;
}

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportValidationResult {
  valid: boolean;
  validRows: any[];
  errors: ImportValidationError[];
  totalRows: number;
  validCount: number;
  errorCount: number;
}

export interface ImportUploadResponse {
  success: boolean;
  data?: ImportValidationResult;
  error?: string;
}

export interface ImportConfirmRequest {
  entityType: EntityType;
  validRows: any[];
}

export interface ImportConfirmResponse {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors?: ImportValidationError[];
}

export interface ImportErrorLog {
  id: string;
  schoolId: number;
  entityType: EntityType;
  rowNumber: number;
  field: string;
  errorMessage: string;
  rowData: string; // JSON string
  createdAt: Date;
}
