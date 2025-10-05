# Feature Specification: Excel Import for Bulk Onboarding (Teachers, Children, Parents)

**Feature Branch**: `019-build-the-excel`  
**Created**: October 5, 2025  
**Status**: Draft  
**Input**: User description: "Build the Excel Import feature for montessori-app, allowing Admins to add Teachers, Children, and Parents in bulk using Excel templates.\n\n### Core Purpose\n- Enable Admins to quickly onboard large sets of Teachers, Children, and Parents using structured Excel files.\n- Support importing and validating Excel templates with clear error feedback.\n- Reduce manual data entry time and ensure consistent formatting across records.\n\n### User Stories\n1. As an Admin, I can download a pre-defined Excel template for Teachers, Children, or Parents.\n2. As an Admin, I can upload a filled template back into the system.\n3. As an Admin, I see a validation summary (e.g., rows imported, rows with errors).\n4. As an Admin, I can fix errors directly in Excel and re-upload.\n5. As an Admin, I can review imported records before confirming final save to database.\n6. As an Admin, I can import all three entity types independently or in sequence (Teachers, then Parents/Children).\n\n### Acceptance Criteria\n- Only Admins can access the import feature.\n- New route: /admin/import with tabs for Teachers, Children, and Parents.\n- Provide downloadable Excel templates:\n  - Teachers: name, email, role, school\n  - Parents: name, email, phone, children_names\n  - Children: firstName, lastName, dob, parent_email, monthly_fee_RON, enrollment_status\n- File validation:\n  - Validate headers, data types, and required fields.\n  - Report errors per row (e.g., missing email, invalid date).\n- Processing:\n  - Parse Excel files server-side.\n  - Batch insert valid rows into database (Drizzle ORM).\n  - Skip or flag invalid rows without breaking the import.\n- Use enums/consts for roles and statuses (no hardcoded strings).\n- Respect montessori-app Constitution:\n  - Components under app/admin/import/components/.\n  - Use micro functions, small files.\n  - use client only for upload form and progress feedback.\n  - DB access only when saving validated records.\n- Support Excel file formats (.xlsx, .xls).\n\n### Edge Cases\n- What happens if the same user/child already exists? [NEEDS CLARIFICATION: skip, update, or warn?]\n- Should Admins be able to link imported Children to existing Parents automatically (by email)? [NEEDS CLARIFICATION]\n- Should the system support CSV uploads too? [NEEDS CLARIFICATION]\n- Should failed imports be logged for future reference? [NEEDS CLARIFICATION]\n\n### Out of Scope\n- Real-time syncing with Google Sheets or external systems.\n- Automated error correction or AI-based field matching.\n- Importing payments or attendance data."

## User Scenarios & Testing

### Primary User Story
An Admin can bulk onboard Teachers, Children, and Parents by downloading Excel templates, filling them, uploading them, reviewing validation results, and confirming the import.

### Acceptance Scenarios
1. **Given** an Admin is on `/admin/import`, **When** they download a template, **Then** they receive a correctly formatted Excel file for the chosen entity.
2. **Given** an Admin has filled a template, **When** they upload it, **Then** the system validates the file and displays a summary of imported and errored rows.
3. **Given** some rows have errors, **When** the Admin fixes them in Excel and re-uploads, **Then** only valid rows are imported and errors are reported again if present.
4. **Given** valid records are uploaded, **When** the Admin reviews and confirms, **Then** the records are saved to the database.
5. **Given** an Admin, **When** importing Teachers, Parents, and Children, **Then** each entity can be imported independently or in sequence.

### Edge Cases

 - If the same user/child already exists, the system will skip importing that record and only add new ones.
 - Imported Children will be automatically linked to existing Parents if the parent email matches.

## Requirements

### Functional Requirements
- **FR-001**: System MUST allow Admins to download Excel templates for Teachers, Children, and Parents.
- **FR-002**: System MUST allow Admins to upload filled Excel templates for each entity type.
- **FR-003**: System MUST validate uploaded files for correct headers, required fields, and data types.
- **FR-004**: System MUST display a validation summary showing imported rows and errors per row.
- **FR-005**: System MUST allow Admins to fix errors in Excel and re-upload files.
- **FR-006**: System MUST allow Admins to review imported records before confirming final save to database.
- **FR-007**: System MUST batch insert valid records into the database, skipping or flagging invalid rows.
- **FR-008**: System MUST restrict access to the import feature to Admins only.
- **FR-009**: System MUST support Excel file formats (.xlsx, .xls).
- **FR-010**: System MUST use enums/consts for roles and statuses (no hardcoded strings).
- **FR-011**: System MUST organize components under `app/admin/import/components/` and use micro functions/small files.
- **FR-012**: System MUST use `use client` only for upload form and progress feedback.
- **FR-013**: System MUST only access the database when saving validated records.
- **FR-014**: System MUST handle unsupported file formats gracefully.
- **FR-015**: System MUST handle missing or extra columns in uploaded files.
- **FR-016**: System MUST report errors for invalid data types in uploaded files.
- **FR-017**: System MUST [NEEDS CLARIFICATION: behavior when duplicate users/children are found]
- **FR-018**: System MUST [NEEDS CLARIFICATION: link imported Children to existing Parents by email?]
- **FR-019**: System MUST only support Excel file formats (.xlsx, .xls); CSV uploads are not accepted.
- **FR-020**: System MUST log all failed imports (rows with errors) for audit and troubleshooting purposes.

### Key Entities
- **Teacher**: Represents a staff member; attributes: name, email, role, school.
- **Parent**: Represents a parent/guardian; attributes: name, email, phone, children_names.
- **Child**: Represents a student; attributes: firstName, lastName, dob, parent_email, monthly_fee_RON, enrollment_status.


## Review & Acceptance Checklist

### Content Quality

## Clarifications
### Session 2025-10-05
- Q: What should happen if the same user or child already exists in the system during import? → A: Skip existing records and import only new ones
- Q: Should Admins be able to link imported Children to existing Parents automatically (by email)? → A: Yes, link automatically if parent email matches
- Q: Should the system support CSV uploads in addition to Excel files? → A: No, only support Excel formats
- Q: Should failed imports (rows with errors) be logged for future reference? → A: Yes, log all failed imports for audit/troubleshooting
### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
