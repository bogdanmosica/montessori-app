import { describe, it, expect } from 'vitest';
import { validateImportFile, confirmImport } from '../../app/admin/import/api';

// Contract test for /admin/import/upload

describe('POST /admin/import/upload', () => {
  it('should validate a correct Excel file and return summary', async () => {
    // Simulate valid file upload
    const result = await validateImportFile({ file: 'valid.xlsx', entity: 'teacher' });
    expect(result.importedRows).toBeGreaterThan(0);
    expect(result.errorRows).toBe(0);
  });

  it('should report errors for invalid rows', async () => {
    const result = await validateImportFile({ file: 'invalid.xlsx', entity: 'child' });
    expect(result.errorRows).toBeGreaterThan(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('POST /admin/import/confirm', () => {
  it('should import validated records and return result', async () => {
    const result = await confirmImport({ entity: 'parent', records: [{ name: 'Jane', email: 'jane@x.com' }] });
    expect(result.success).toBe(true);
    expect(result.importedCount).toBeGreaterThan(0);
  });
});
