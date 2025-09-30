# Feature Specification: Extend Child Creation with Monthly Fee Assignment

**Feature Branch**: `009-extend-child-creation`  
**Created**: September 29, 2025  
**Status**: Draft  
**Input**: User description: "Extend child creation flows in montessori-app so that Admins can assign a monthly fee (in RON) when adding a child."

## Execution Flow (main)
```
1. Parse user description from Input
   ✅ Feature involves adding monthly fee assignment to child creation
2. Extract key concepts from description
   ✅ Actors: Admins
   ✅ Actions: assign monthly fee during child creation
   ✅ Data: monthly fee in RON currency
   ✅ Constraints: Admin-only access, RON currency standard
3. For each unclear aspect:
   ✅ Marked with [NEEDS CLARIFICATION] where requirements need business decision
4. Fill User Scenarios & Testing section
   ✅ Clear user flows for both affected pages identified
5. Generate Functional Requirements
   ✅ Each requirement is testable and specific
6. Identify Key Entities
   ✅ Fee data storage and currency standardization identified
7. Run Review Checklist
   ⚠️ WARN "Spec has uncertainties" - Some business decisions needed
8. Return: SUCCESS (spec ready for planning after clarifications)
```

---

## Clarifications

### Session 2025-09-29
- Q: Should the monthly fee field be required or optional when creating a child? → A: Optional - Admin can create a child without specifying a fee
- Q: Should fees be associated with child records or individual enrollment records? → A: Both - Child has default fee, enrollments can override it
- Q: Should Admins be able to modify fees after initial creation? → A: Yes - Full edit capability for both child default and enrollment override fees
- Q: What should be the minimum acceptable fee amount? → A: 0
- Q: How should fee display work when a child has no default fee but an enrollment has an override fee? → A: Show enrollment fee only - "1200 RON"

---

## User Scenarios & Testing

### Primary User Story
As a Montessori school Admin, I need to assign a monthly fee in RON when creating new child records, so that the system accurately reflects the financial commitment for each enrolled child from the moment they are added to the system.

### Acceptance Scenarios
1. **Given** I am logged in as an Admin on `/admin/enrollments/new`, **When** I fill out the child creation form including a monthly fee of 1500 RON, **Then** the system saves the child record with the specified fee and displays it in subsequent views.

2. **Given** I am logged in as an Admin reviewing an application on `/admin/applications/create-child`, **When** I approve the application and set a monthly fee of 1200 RON, **Then** the child is created with the fee attached and the application status is updated.

3. **Given** I am on either child creation page, **When** I enter an invalid fee (negative number or non-numeric text), **Then** the system shows a validation error and prevents form submission.

4. **Given** I have successfully created a child with a monthly fee, **When** I view the child's details in the enrollment or application management sections, **Then** the fee is clearly displayed with RON currency notation.

### Edge Cases
- When an Admin creates a child without specifying a fee, the system saves the child record with no fee assigned (displays as "No fee set" or similar in listings)
- When an Admin sets a fee to 0 RON, the system displays it as "Free enrollment" or "0 RON"
- Admins can modify both child default fees and enrollment override fees at any time after creation
- Different enrollments for the same child can have different fees by overriding the child's default fee at the enrollment level
- How should the system handle fee changes over time (e.g., annual increases)?

## Requirements

### Functional Requirements
- **FR-001**: System MUST allow Admins to enter a monthly fee amount during child creation on `/admin/enrollments/new`
- **FR-002**: System MUST allow Admins to enter a monthly fee amount during child creation on `/admin/applications/create-child`
- **FR-003**: System MUST validate fee input to accept only numeric values greater than or equal to 0 RON (free enrollments allowed)
- **FR-004**: System MUST store all fees in RON currency (no dollar amounts)
- **FR-005**: System MUST display currency as "RON" in all user interfaces showing fee amounts
- **FR-006**: System MUST restrict fee assignment and modification to Admin users only
- **FR-007**: System MUST persist fee information in the database linked to the child record
- **FR-008**: System MUST display the assigned fee in child detail views and enrollment listings
- **FR-009**: System MUST prevent form submission if fee validation fails
- **FR-010**: System MUST use centralized currency definitions from constants/enums (no hardcoded strings)
- **FR-014**: System MUST display enrollment override fees without reference to missing default fees (show "1200 RON" not "No default fee, Enrollment: 1200 RON")

- **FR-011**: System MUST allow optional fee entry during child creation (Admins can create children without specifying a fee)

- **FR-012**: System MUST allow Admins to modify both child default fees and enrollment override fees after initial creation
- **FR-013**: System MUST associate fees using a hybrid model where children have default fees and individual enrollments can override the child's default fee
- **FR-015**: System MUST validate fee input to reject values exceeding 10,000 RON maximum limit

### Key Entities
- **Child Default Fee**: Optional monthly payment amount in RON stored at the child level, serves as default for new enrollments
- **Enrollment Fee Override**: Optional monthly payment amount in RON that overrides the child's default fee for a specific enrollment
- **Currency Standard**: System-wide RON currency configuration to ensure consistent display and validation across all monetary fields

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
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
- [x] Review checklist passed

---
