# Teacher Progress Board - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Database migrations applied ✅ (already done)
- React DnD dependencies installed ✅ (already done)
- Teacher user account with appropriate role

### Step 1: Seed Default Progress Columns

Run the seed script to create default progress columns for all schools:

```bash
npx tsx scripts/seed/progress-columns.ts
```

This creates 4 default columns:
- **Not Started** (Red)
- **In Progress** (Amber)
- **Completed** (Green)
- **On Hold** (Gray)

### Step 2: Access the Progress Board

1. Login as a teacher user
2. Navigate to: `/teacher/progress-board`
3. You should see the empty progress board with column headers

### Step 3: Create Your First Assignment

1. Click the "New Assignment" button
2. Select a lesson from the dropdown
3. Optionally select a student (or leave blank for template)
4. Choose initial status (default: "Not Started")
5. Click "Create Assignment"

## 📊 Using the Progress Board

### Creating Assignments

**Assigned Lesson Card** (specific student):
- Select both lesson and student
- Card will show student name
- Tracks individual student progress

**Template Card** (planning):
- Select lesson only
- Leave student field empty
- Card shows "Unassigned"
- Use for lesson planning

### Moving Cards

**Drag and Drop**:
1. Click and hold on a card
2. Drag to target column
3. Release to drop
4. Card updates automatically

**What Happens**:
- Card moves to new column
- Position is saved
- Status updates
- Timestamp recorded
- UI updates optimistically

### Filtering

**By Student**:
1. Click the "Student" dropdown
2. Select a student name
3. Board shows only that student's cards
4. Click "Clear Filters" to reset

**By Category**:
1. Click the "Category" dropdown
2. Select a lesson category
3. Board shows only cards in that category
4. Click "Clear Filters" to reset

**Combined Filters**:
- Apply both student and category filters
- Board shows cards matching both criteria

### Deleting Cards

1. Hover over a card
2. Click the trash icon (appears on hover)
3. Confirm deletion
4. Card is removed from board

## 🔒 Card Locking

### How It Works
- When you start dragging a card, it's automatically locked
- Other users see a lock icon on the card
- Locked cards cannot be dragged by others
- Locks expire after 5 minutes of inactivity

### Lock Indicators
- 🔒 Lock icon on card = locked by another user
- No icon = available for drag

## 🎯 Best Practices

### Organization
1. **Start with Templates**: Create unassigned template cards for common lessons
2. **Assign to Students**: Duplicate templates or create new assignments for specific students
3. **Use Categories**: Organize lessons by subject (Mathematics, Language, Science, etc.)
4. **Regular Updates**: Move cards as students progress through lessons

### Workflow Tips
1. **Morning Setup**: Review "Not Started" column, plan the day
2. **During Class**: Move cards to "In Progress" as lessons begin
3. **End of Day**: Move completed cards, use "On Hold" for interrupted lessons
4. **Weekly Review**: Check progress across all students

### Filtering Strategies
- **Individual Focus**: Filter by student to see their complete progress
- **Subject Planning**: Filter by category to plan subject-specific lessons
- **Combined View**: Use both filters to track student progress in specific subjects

## 🛠️ Troubleshooting

### Card Won't Move
- **Check Lock Icon**: Card may be locked by another user
- **Wait**: Locks expire after 5 minutes
- **Refresh Page**: If issue persists

### Empty Board
- **No Cards Created**: Click "New Assignment" to create first card
- **Filters Active**: Check if filters are applied, click "Clear Filters"
- **Wrong School/Role**: Verify you're logged in as teacher in correct school

### Assignment Creation Fails
- **Duplicate Assignment**: Can't assign same lesson to same student twice
- **Invalid Lesson/Student**: Ensure selections are valid for your school
- **Network Error**: Check internet connection, try again

### Performance Issues
- **Large Number of Cards**: Use filters to reduce visible cards
- **Slow Drag**: Check internet connection
- **Browser Issues**: Try different browser or clear cache

## 🔄 Automatic Features

### Lock Cleanup
- Expired locks are automatically cleaned every minute
- No manual intervention needed
- System handles stuck locks from disconnected users

### Position Management
- Card positions auto-rebalance when cards are added/removed
- No gaps in card ordering
- Maintains visual consistency

### Audit Trail
- All card moves are logged
- Status changes tracked with timestamps
- Full history available for reporting

## 📱 Mobile/Tablet Usage

### Touch Support
- Drag cards with touch gestures
- Responsive design adapts to screen size
- Columns stack on mobile devices
- All features available on touch devices

### Recommended Devices
- ✅ Tablets (iPad, Android tablets)
- ✅ Desktop/Laptop
- ⚠️ Phones (works but limited screen space)

## 🎨 Customization

### Column Colors
Current default colors:
- Not Started: Red (#EF4444)
- In Progress: Amber (#F59E0B)
- Completed: Green (#10B981)
- On Hold: Gray (#6B7280)

*Note: Column customization is admin-managed. Contact admin to change colors or add columns.*

## 🔐 Security Notes

- Only Teachers can access the progress board
- Admins also have access for management purposes
- All data is school-scoped (multi-tenant isolation)
- Actions are logged for audit purposes
- Card locks prevent data conflicts

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
3. Contact system administrator
4. Report bugs via proper channels

---

**Last Updated**: October 3, 2025
**Feature Version**: 1.0.0
