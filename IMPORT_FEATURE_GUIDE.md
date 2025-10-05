# Excel Import Feature - Quick Start Guide

## 🚀 How to Access the Import Feature

### Step 1: Start the Development Server
```bash
pnpm dev
```
The server will start on http://localhost:3000 (or 3002 if 3000 is in use)

### Step 2: Login as Admin
1. Navigate to http://localhost:3000/sign-in
2. Use these credentials:
   - **Email:** `admin@test.com`
   - **Password:** `admin123`

### Step 3: Access Import Page
After login, you have **two ways** to access the import feature:

#### Option 1: Click the "Import" button in navigation (NEW!)
- Look for the navigation bar at the top
- Click the **"Import"** button (has an upload icon 📤)

#### Option 2: Direct URL
- Navigate to: http://localhost:3000/admin/import

## 📋 Using the Import Feature

### Download Templates
1. Select the entity tab (Teachers, Parents, or Children)
2. Click **"Download Template"** button
3. Excel file will download automatically

### Prepare Your Data
Fill in the downloaded Excel template with your data:

**Teachers Template:**
- name (required)
- email (required)
- role (optional)
- wage (optional)
- nationality (optional)

**Parents Template:**
- name (required)
- email (required)
- phone (optional)
- children_names (optional)

**Children Template:**
- firstName (required)
- lastName (required)
- dob (required - format: YYYY-MM-DD)
- parent_email (required - must match existing parent)
- monthly_fee_RON (required)
- enrollment_status (required - ACTIVE, INACTIVE, or WAITLISTED)

### Upload and Import
1. Click **"Choose File"** and select your filled Excel file
2. Click **"Upload and Validate"**
3. Review the validation results
4. If valid, click **"Confirm and Import"**
5. Records will be imported into the database

## 🎯 Important Notes

### Data Requirements
- **File Format:** Only .xlsx or .xls files
- **File Size:** Maximum 10MB
- **Row Limit:** Maximum 1000 rows per import
- **Duplicates:** Existing records are automatically skipped
- **Children:** Parent must exist before importing children

### Validation Rules
- All required fields must be filled
- Email addresses must be valid
- Dates must be valid and not in the future
- Enrollment status must be ACTIVE, INACTIVE, or WAITLISTED
- Monthly fees must be positive numbers

### Security
- ✅ Admin-only access (enforced by middleware)
- ✅ Multi-tenant data isolation
- ✅ All imports scoped to your school
- ✅ Audit logging for all actions

## 🐛 Troubleshooting

### Cannot Access Import Page
- Ensure you're logged in as an admin
- Check that the URL is correct: /admin/import
- Verify the server is running

### Template Download Not Working
- Check browser console for errors
- Try a different browser
- Ensure you're authenticated

### Upload Fails
- Verify file is .xlsx or .xls format
- Check file size is under 10MB
- Ensure all required fields are filled
- Review validation errors displayed

### Import Button Disabled
- Select a file first by clicking "Choose File"
- Ensure a file is actually selected

## 📊 What Gets Imported

### Teachers
Creates both:
1. User account (email/password)
2. Teacher profile (linked to school)

**Default Password:** `Password123!` (users should change this)

### Parents
Creates:
1. Parent profile (linked to school)
2. Email can be used to link children

### Children
Creates:
1. Child record
2. Automatically links to parent by email
3. Sets enrollment status and monthly fee

## 🔍 Example Data

### Teachers.xlsx
```
name            | email                  | role    | wage  | nationality
John Doe        | john.doe@school.com    | teacher | 5000  | Romanian
Jane Smith      | jane.smith@school.com  | teacher | 5500  | American
```

### Parents.xlsx
```
name           | email                | phone         | children_names
Maria Johnson  | maria@parent.com     | +40123456789  | Emma, Liam
David Brown    | david@parent.com     | +40987654321  | Noah
```

### Children.xlsx
```
firstName | lastName | dob        | parent_email      | monthly_fee_RON | enrollment_status
Emma      | Johnson  | 2020-01-15 | maria@parent.com  | 1500           | ACTIVE
Liam      | Johnson  | 2021-03-20 | maria@parent.com  | 1500           | ACTIVE
Noah      | Brown    | 2019-05-10 | david@parent.com  | 1500           | ACTIVE
```

## 📝 Testing Checklist

- [ ] Login as admin
- [ ] Navigate to import page via navigation bar
- [ ] Download teacher template
- [ ] Download parent template
- [ ] Download children template
- [ ] Fill templates with test data
- [ ] Upload and validate teachers
- [ ] Upload and validate parents
- [ ] Upload and validate children
- [ ] Verify records in database
- [ ] Test duplicate handling
- [ ] Test validation errors
- [ ] Test parent-child linking

## 🎉 Success!

If everything works correctly, you should see:
- ✅ Templates download successfully
- ✅ Files upload without errors
- ✅ Validation passes for valid data
- ✅ Import confirmation shows imported count
- ✅ Records appear in the respective admin pages

## 📚 Additional Resources

- **Full Documentation:** `/docs/import-feature.md`
- **Test Report:** `/docs/import-feature-test-report.md`
- **API Documentation:** See feature docs for endpoint details

---

**Need Help?** Check the console logs or refer to the detailed documentation in the `/docs` folder.
