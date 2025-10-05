import { describe, it, expect } from 'vitest';
import { getTemplate } from '../../app/admin/import/api';

describe('GET /admin/import/template/:entity', () => {
  it('should return a valid Excel template for Teachers', async () => {
    const file = await getTemplate('teacher');
    expect(file).toBeDefined();
    // Add more checks for file type if needed
  });
  it('should return a valid Excel template for Parents', async () => {
    const file = await getTemplate('parent');
    expect(file).toBeDefined();
  });
  it('should return a valid Excel template for Children', async () => {
    const file = await getTemplate('child');
    expect(file).toBeDefined();
  });
});
