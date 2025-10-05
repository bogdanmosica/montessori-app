/**
 * Excel Template Generator
 */

import * as XLSX from 'xlsx';
import { ENTITY_TYPES, EntityType } from '@/lib/constants/import-constants';

const TEACHER_HEADERS = ['name', 'email', 'role', 'wage', 'nationality'];
const PARENT_HEADERS = ['name', 'email', 'phone', 'children_names'];
const CHILD_HEADERS = [
  'firstName',
  'lastName',
  'dob',
  'parent_email',
  'monthly_fee_RON',
  'enrollment_status',
];

export function generateTemplate(entityType: EntityType): Buffer {
  let headers: string[];
  let sampleData: any[];

  switch (entityType) {
    case ENTITY_TYPES.TEACHER:
      headers = TEACHER_HEADERS;
      sampleData = [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'teacher',
          wage: 5000,
          nationality: 'Romanian',
        },
      ];
      break;

    case ENTITY_TYPES.PARENT:
      headers = PARENT_HEADERS;
      sampleData = [
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+40712345678',
          children_names: 'Child1, Child2',
        },
      ];
      break;

    case ENTITY_TYPES.CHILD:
      headers = CHILD_HEADERS;
      sampleData = [
        {
          firstName: 'Emma',
          lastName: 'Smith',
          dob: '2020-01-15',
          parent_email: 'jane.smith@example.com',
          monthly_fee_RON: 1500,
          enrollment_status: 'ACTIVE',
        },
      ];
      break;

    default:
      throw new Error(`Invalid entity type: ${entityType}`);
  }

  // Create worksheet with headers
  const ws = XLSX.utils.json_to_sheet(sampleData, { header: headers });

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, entityType);

  // Generate buffer
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export function getTemplateFileName(entityType: EntityType): string {
  return `${entityType}_import_template.xlsx`;
}
