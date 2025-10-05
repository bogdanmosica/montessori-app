import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { join } from 'path';

const outputDir = join(process.cwd(), 'sample-templates');

// Create Teachers sample
const teachersData = [
  {
    name: 'Maria Popescu',
    email: 'maria.popescu@school.com',
    role: 'teacher',
    wage: 5000,
    nationality: 'Romanian',
  },
  {
    name: 'Ion Ionescu',
    email: 'ion.ionescu@school.com',
    role: 'teacher',
    wage: 5500,
    nationality: 'Romanian',
  },
];

// Create Parents sample
const parentsData = [
  {
    name: 'Elena Georgescu',
    email: 'elena.georgescu@parent.com',
    phone: '+40721234567',
    children_names: 'Ana, Mihai',
  },
  {
    name: 'Andrei Dumitrescu',
    email: 'andrei.dumitrescu@parent.com',
    phone: '+40722345678',
    children_names: 'Sofia',
  },
];

// Create Children sample
const childrenData = [
  {
    firstName: 'Ana',
    lastName: 'Georgescu',
    dob: '2020-03-15',
    parent_email: 'elena.georgescu@parent.com',
    monthly_fee_RON: 1500,
    enrollment_status: 'ACTIVE',
  },
  {
    firstName: 'Mihai',
    lastName: 'Georgescu',
    dob: '2021-06-20',
    parent_email: 'elena.georgescu@parent.com',
    monthly_fee_RON: 1500,
    enrollment_status: 'ACTIVE',
  },
  {
    firstName: 'Sofia',
    lastName: 'Dumitrescu',
    dob: '2019-11-10',
    parent_email: 'andrei.dumitrescu@parent.com',
    monthly_fee_RON: 1500,
    enrollment_status: 'ACTIVE',
  },
];

console.log('Creating sample templates...');

// Create output directory
try {
  require('fs').mkdirSync(outputDir, { recursive: true });
} catch (e) {
  // Directory exists
}

// Create Teachers template
const teachersWS = XLSX.utils.json_to_sheet(teachersData);
const teachersWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(teachersWB, teachersWS, 'Teachers');
writeFileSync(join(outputDir, 'teachers_sample.xlsx'), XLSX.write(teachersWB, { type: 'buffer', bookType: 'xlsx' }));
console.log('✅ Created: teachers_sample.xlsx');

// Create Parents template
const parentsWS = XLSX.utils.json_to_sheet(parentsData);
const parentsWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(parentsWB, parentsWS, 'Parents');
writeFileSync(join(outputDir, 'parents_sample.xlsx'), XLSX.write(parentsWB, { type: 'buffer', bookType: 'xlsx' }));
console.log('✅ Created: parents_sample.xlsx');

// Create Children template
const childrenWS = XLSX.utils.json_to_sheet(childrenData);
const childrenWB = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(childrenWB, childrenWS, 'Children');
writeFileSync(join(outputDir, 'children_sample.xlsx'), XLSX.write(childrenWB, { type: 'buffer', bookType: 'xlsx' }));
console.log('✅ Created: children_sample.xlsx');

console.log('\n📁 Sample files created in:', outputDir);
console.log('\n📝 To test the import feature:');
console.log('1. Navigate to http://localhost:3000/admin/import');
console.log('2. Upload parents_sample.xlsx first');
console.log('3. Then upload children_sample.xlsx');
console.log('4. Finally upload teachers_sample.xlsx');
