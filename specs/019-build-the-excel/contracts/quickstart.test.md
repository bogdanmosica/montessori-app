# Quickstart Test: Excel Import Feature

## Scenario: Admin imports Teachers, Parents, and Children

1. Admin navigates to `/admin/import`
2. Downloads Excel template for Teachers
3. Fills and uploads Teachers template
4. Reviews validation summary
5. Downloads and uploads Parents template
6. Downloads and uploads Children template
7. Reviews validation summary for each
8. Confirms valid records for final save
9. Verifies imported records in system

## Expected Results
- All valid rows are imported
- Invalid rows are reported and logged
- Children are linked to Parents by email
- No duplicate users/children created
- All actions logged for audit

---
