# Quickstart: Excel Import Feature

## Prerequisites
- Admin access to montessori-app
- Excel templates for Teachers, Parents, Children

## Steps
1. Go to `/admin/import` route
2. Download the desired Excel template (Teachers, Parents, Children)
3. Fill in the template with required data
4. Upload the completed template via the import form
5. Review validation summary (imported rows, errors)
6. Fix any errors in Excel and re-upload if needed
7. Confirm valid records for final save to database

## Validation
- Only Admins can access import feature
- Only Excel files (.xlsx, .xls) are accepted
- Invalid rows are reported and logged
- Children are automatically linked to Parents by email
- All actions are logged for audit

## Troubleshooting
- If upload fails, check file format and required fields
- Review error summary for details
- Contact support if persistent issues

---
