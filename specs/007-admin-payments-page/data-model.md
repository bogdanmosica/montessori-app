# Data Model: Admin Payments Management

## Core Entities

### Payment Record
**Description**: Core payment transaction record linking parents to children with school scoping

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key to schools, Multi-tenant scoping)
- `parent_id`: UUID (Foreign Key to parents)  
- `child_id`: UUID (Foreign Key to children)
- `stripe_payment_id`: String (Stripe Payment Intent ID, nullable for bank transfers)
- `amount`: Decimal (Payment amount in cents)
- `currency`: String (ISO currency code, default: "USD")
- `payment_method`: Enum ("stripe_card", "stripe_bank", "bank_transfer", "ach")
- `payment_status`: Enum ("pending", "completed", "failed", "cancelled", "refunded")
- `payment_date`: DateTime (When payment was initiated)
- `completed_date`: DateTime (When payment was completed, nullable)
- `failure_reason`: String (Error message for failed payments, nullable)
- `description`: String (Payment description, e.g., "September Tuition")
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- Belongs to School (multi-tenant scoping)
- Belongs to Parent
- Belongs to Child (active enrollment validation)

**Validation Rules**:
- Amount must be positive
- School, parent, and child must form valid relationship
- Child must have active enrollment for payment date
- Stripe payments must have valid stripe_payment_id
- Currency must be supported by school configuration

**Indexes**:
- Primary: (id)
- Multi-tenant: (school_id, payment_date DESC)
- Parent lookup: (school_id, parent_id, payment_date DESC)
- Child lookup: (school_id, child_id, payment_date DESC)
- Status filtering: (school_id, payment_status, payment_date DESC)

### Payment Method
**Description**: Stored payment method information for parents

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key to schools, Multi-tenant scoping)
- `parent_id`: UUID (Foreign Key to parents)
- `stripe_payment_method_id`: String (Stripe Payment Method ID, nullable)
- `payment_type`: Enum ("card", "bank_account", "ach")
- `is_primary`: Boolean (Primary payment method for parent)
- `last_four`: String (Last 4 digits for display, encrypted)
- `brand`: String (Card brand or bank name, encrypted)
- `expires_at`: Date (Expiration date for cards, nullable)
- `is_active`: Boolean (Active status)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- Belongs to School (multi-tenant scoping)
- Belongs to Parent
- Has many Payment Records

**Validation Rules**:
- Only one primary payment method per parent per school
- Stripe payment methods must have valid stripe_payment_method_id
- Card types must have expiration date
- Last four digits must be exactly 4 characters

**Indexes**:
- Primary: (id)
- Parent lookup: (school_id, parent_id, is_primary DESC)
- Active methods: (school_id, is_active, payment_type)

### Invoice
**Description**: Billing document containing one or more payment records

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key to schools, Multi-tenant scoping)
- `parent_id`: UUID (Foreign Key to parents)
- `invoice_number`: String (Sequential invoice number per school)
- `billing_period_start`: Date (Start of billing period)
- `billing_period_end`: Date (End of billing period)
- `subtotal`: Decimal (Total before taxes)
- `tax_amount`: Decimal (Tax amount)
- `total_amount`: Decimal (Final total amount)
- `status`: Enum ("draft", "sent", "paid", "overdue", "cancelled")
- `due_date`: Date (Payment due date)
- `paid_date`: Date (Date when fully paid, nullable)
- `stripe_invoice_id`: String (Stripe Invoice ID, nullable)
- `pdf_url`: String (URL to generated PDF, nullable)
- `sent_date`: Date (Date when sent to parent, nullable)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- Belongs to School (multi-tenant scoping)
- Belongs to Parent
- Has many Payment Records
- Has many Invoice Line Items

**Validation Rules**:
- Invoice number must be unique per school
- Billing period end must be after start
- Due date must be after creation date
- Total amount must match subtotal + tax
- Status transitions must follow business rules

**Indexes**:
- Primary: (id)
- School invoices: (school_id, due_date DESC)
- Parent invoices: (school_id, parent_id, due_date DESC)
- Unique invoice number: (school_id, invoice_number)

### Invoice Line Item
**Description**: Individual line items within an invoice

**Fields**:
- `id`: UUID (Primary Key)
- `invoice_id`: UUID (Foreign Key to invoices)
- `child_id`: UUID (Foreign Key to children)
- `description`: String (Line item description)
- `quantity`: Integer (Quantity, default: 1)
- `unit_price`: Decimal (Price per unit in cents)
- `total_price`: Decimal (Quantity × unit_price)
- `item_type`: Enum ("tuition", "fees", "supplies", "activities", "other")
- `billing_period_start`: Date (Period covered by this line item)
- `billing_period_end`: Date (End of period for this line item)

**Relationships**:
- Belongs to Invoice
- Belongs to Child

**Validation Rules**:
- Total price must equal quantity × unit_price
- Quantity must be positive
- Unit price must be non-negative
- Billing period must be within invoice period

### Payment Alert
**Description**: System-generated alerts for payment issues requiring admin attention

**Fields**:
- `id`: UUID (Primary Key)
- `school_id`: UUID (Foreign Key to schools, Multi-tenant scoping)
- `parent_id`: UUID (Foreign Key to parents, nullable)
- `payment_id`: UUID (Foreign Key to payments, nullable)
- `alert_type`: Enum ("failed_payment", "overdue_payment", "expired_card", "webhook_failure")
- `severity`: Enum ("low", "medium", "high", "critical")
- `title`: String (Alert title for display)
- `message`: String (Alert message/description)
- `is_resolved`: Boolean (Resolution status)
- `resolved_by`: UUID (Admin who resolved, nullable)
- `resolved_at`: DateTime (Resolution timestamp, nullable)
- `created_at`: DateTime
- `updated_at`: DateTime

**Relationships**:
- Belongs to School (multi-tenant scoping)
- Belongs to Parent (optional)
- Belongs to Payment Record (optional)
- Resolved by Admin User (optional)

**Validation Rules**:
- High severity alerts must have resolution tracking
- Resolved alerts must have resolved_by and resolved_at
- Alert type must match related entities (payment alerts need payment_id)

**Indexes**:
- Primary: (id)
- Active alerts: (school_id, is_resolved, severity DESC, created_at DESC)
- Parent alerts: (school_id, parent_id, is_resolved, created_at DESC)

### Access Log (Extended)
**Description**: Audit trail for payment-related admin actions

**Additional Fields for Payment Context**:
- `payment_id`: UUID (Foreign Key to payments, nullable)
- `payment_action`: Enum ("view_payments", "process_refund", "update_method", "download_invoice")
- `amount_affected`: Decimal (Amount involved in action, nullable)

**Payment-Specific Log Events**:
- Payment record access and filtering
- Refund processing with amounts
- Payment method updates
- Invoice generation and downloads
- Alert acknowledgment and resolution

## State Transitions

### Payment Status Flow
```
pending → completed (successful payment)
pending → failed (payment processing failure)  
pending → cancelled (manual cancellation)
completed → refunded (refund processed)
failed → pending (retry attempt)
```

### Invoice Status Flow
```
draft → sent (invoice sent to parent)
sent → paid (payment received)
sent → overdue (due date passed)
overdue → paid (late payment received)
any → cancelled (invoice cancelled)
```

### Alert Resolution Flow
```
created → acknowledged (admin viewed)
acknowledged → resolved (issue fixed)
resolved → reopened (issue recurred)
```

## Multi-Tenant Considerations

### School Scoping Strategy
- All entities include `school_id` for tenant isolation
- Database queries MUST include school context
- API endpoints validate school access permissions
- Data exports are school-scoped by default

### Data Isolation Requirements
- Cross-tenant data access strictly prohibited
- Database views enforce school-level filtering  
- Backup and restore operations maintain tenant boundaries
- Reporting aggregations respect tenant scoping

### Performance Optimization
- Partition large tables by school_id where appropriate
- Tenant-specific indexes for common query patterns
- Connection pooling considers tenant distribution
- Caching strategies account for multi-tenant access patterns