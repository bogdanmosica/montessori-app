/**
 * Excel File Parser
 */

import * as XLSX from 'xlsx';
import { IMPORT_CONSTANTS, IMPORT_MESSAGES } from '@/lib/constants/import-constants';

export interface ParsedExcelData {
  rows: any[];
  totalRows: number;
}

export function parseExcelFile(buffer: Buffer): ParsedExcelData {
  try {
    // Read workbook from buffer
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error(IMPORT_MESSAGES.NO_DATA_FOUND);
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (!rows || rows.length === 0) {
      throw new Error(IMPORT_MESSAGES.NO_DATA_FOUND);
    }

    if (rows.length > IMPORT_CONSTANTS.MAX_ROWS_PER_IMPORT) {
      throw new Error(IMPORT_MESSAGES.TOO_MANY_ROWS);
    }

    return {
      rows,
      totalRows: rows.length,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(IMPORT_MESSAGES.PARSE_ERROR);
  }
}
