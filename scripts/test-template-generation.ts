import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Test template generation
const TEACHER_HEADERS = ['name', 'email', 'role', 'wage', 'nationality'];

const sampleData = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'teacher',
    wage: 5000,
    nationality: 'Romanian',
  },
];

console.log('Generating test template...');

// Create worksheet
const ws = XLSX.utils.json_to_sheet(sampleData, { header: TEACHER_HEADERS });

// Create workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'teacher');

// Generate buffer
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

console.log('Buffer type:', typeof buffer);
console.log('Buffer length:', buffer.length);
console.log('Is Buffer:', Buffer.isBuffer(buffer));

// Write to file
const outputPath = join(process.cwd(), 'test_teacher_template.xlsx');
writeFileSync(outputPath, buffer);

console.log('Template saved to:', outputPath);
console.log('✅ Test complete!');
