# Excel Import Feature Documentation

## Overview

The Excel Import feature allows administrators to bulk import Teachers, Parents, and Children into the Montessori application using Excel files. This feature provides template download, validation, error handling, and audit logging.

## Features

### 1. Template Download
- Pre-formatted Excel templates for each entity type (Teachers, Parents, Children)
- Sample data included for reference
- Ensures consistent data structure

### 2. File Upload & Validation
- Supports `.xlsx` and `.xls` file formats
- Maximum file size: 10MB
- Maximum rows per import: 1000
- Server-side validation for data integrity
- Real-time error feedback

### 3. Data Validation Rules

#### Teachers
- **Required fields**: name, email
- **Optional fields**: role, wage, nationality
- **Constraints**:
  - Valid email format
  - Unique email per tenant
  - Positive wage value

#### Parents
- **Required fields**: name, email
- **Optional fields**: phone, children_names
- **Constraints**:
  - Valid email format
  - Unique email per tenant

#### Children
- **Required fields**: firstName, lastName, dob, parent_email, monthly_fee_RON, enrollment_status
- **Constraints**:
  - Valid date format (not in future)
  - Parent email must match existing parent
  - Positive monthly fee
  - Valid enrollment status (ACTIVE, INACTIVE, WAITLISTED)

### 4. Import Process

1. **Download Template**: Get the Excel template for the desired entity type
2. **Fill Data**: Complete the template with required information
3. **Upload File**: Upload the filled template
4. **Validate**: System validates all rows and reports errors
5. **Review**: Review validation summary
6. **Confirm**: Confirm and import valid records
7. **Results**: View import results (imported, skipped, errors)

### 5. Duplicate Handling
- Existing records are automatically skipped
- Teachers: Checked by email
- Parents: Checked by email within school
- Children: Imported if parent exists
- Duplicate count reported in results

### 6. Error Logging
- All validation errors are logged to `import_error_logs` table
- Includes row number, field, error message, and full row data
- Scoped by school/tenant for audit purposes

### 7. Multi-Tenant Security
- All imports scoped to admin's school/tenant
- RBAC enforcement (Admin-only access)
- Automatic school ID association
- Parent-child linking within same school

### 8. Audit Trail
- Access logs for all import attempts
- Import error logs for failed validations
- Success/failure tracking
- User and timestamp tracking

## API Endpoints

### GET `/admin/import/api/template`
Download Excel template for a specific entity type.

**Query Parameters:**
- `type`: Entity type (teacher, parent, child)

**Response:** Excel file download

### POST `/admin/import/api/upload`
Upload and validate Excel file.

**Form Data:**
- `file`: Excel file
- `entityType`: Entity type

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "validRows": [...],
    "errors": [...],
    "totalRows": 10,
    "validCount": 9,
    "errorCount": 1
  }
}
```

### POST `/admin/import/api/confirm`
Confirm and import validated records.

**Request Body:**
```json
{
  "entityType": "teacher",
  "validRows": [...]
}
```

**Response:**
```json
{
  "success": true,
  "importedCount": 9,
  "skippedCount": 1,
  "errors": []
}
```

## Performance Considerations

### Batch Processing
- Records processed in batches of 100
- Prevents memory issues with large imports
- Optimized database operations

### Validation
- Server-side validation for security
- Parallel validation where possible
- Early termination on critical errors

### Scalability
- File size limits prevent overload
- Row count limits ensure reasonable processing time
- Error logging doesn't block import flow

## Reliability

### Error Handling
- Graceful handling of parsing errors
- Detailed error messages for users
- Error logs for troubleshooting
- Transaction-safe imports (rollback on critical failures)

### Data Integrity
- Type validation for all fields
- Referential integrity (parent-child relationships)
- Duplicate prevention
- Multi-tenant data isolation

## Security

### Access Control
- Admin-only feature (RBAC enforced)
- Protected routes via middleware
- Session-based authentication
- School/tenant scoping on all operations

### Data Protection
- File upload validation
- XSS prevention in error messages
- SQL injection prevention (Drizzle ORM)
- No sensitive data in error logs

## Usage Instructions

See [Import Usage Guide](../README.md#import-feature) for step-by-step instructions.

## Troubleshooting

### Common Issues

1. **File upload fails**
   - Check file format (.xlsx or .xls only)
   - Verify file size (< 10MB)
   - Ensure proper file structure

2. **Validation errors**
   - Review error summary for details
   - Fix data in Excel file
   - Re-upload corrected file

3. **Duplicate records skipped**
   - Expected behavior for existing records
   - Check import results for details
   - Update existing records separately if needed

4. **Parent not found errors**
   - Import parents before children
   - Verify parent email matches exactly
   - Check school/tenant scoping

## Future Enhancements

- CSV format support
- Update existing records option
- Import history and rollback
- Scheduled imports
- Email notifications for import results
- Advanced duplicate detection
