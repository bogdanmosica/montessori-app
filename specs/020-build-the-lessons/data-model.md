# Data Model: Lessons Management

## Entities

### Lesson
- id: UUID
- title: string
- description: text
- category: enum (Practical Life, Sensorial, Language, etc.)
- createdById: UUID (references User)
- schoolId: UUID (references School)
- visibility: enum (admin_global, teacher_private)
- createdAt: timestamp
- updatedAt: timestamp

#### Validation Rules
- title: required, max 100 chars
- description: optional, max 2000 chars
- category: required, must be valid enum value
- createdById: required
- schoolId: required
- visibility: required, must be valid enum value

#### State Transitions
- On creation: lesson is visible per `visibility` and `schoolId`
- On update: only creator (Teacher) or Admin can edit
- On delete: only creator (Teacher) or Admin can delete
- On Teacher leaving: Admin chooses per lesson (archive, reassign, delete)
- On cloning: Teachers can clone global lessons to create personal copies

### User
- id: UUID
- role: enum (Admin, Teacher)
- schoolId: UUID

### School
- id: UUID
- name: string
