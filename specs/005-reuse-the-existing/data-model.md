# Data Model: Reusable Admin Navigation Bar

## Entities

### NavigationItem
**Description**: Represents a single navigation link in the admin navigation bar
**Fields**:
- `href: string` - The URL path for the navigation link (e.g., "/admin/applications")
- `label: string` - Display text for the navigation item (e.g., "Applications")  
- `icon: ReactElement` - Icon component to display alongside the label
- `isActive?: boolean` - Whether this navigation item represents the current page
- `isEnabled: boolean` - Whether the navigation item is clickable/accessible (default: true)

**Validation Rules**:
- `href` must start with "/admin/"
- `label` must be non-empty string
- `icon` must be a valid React component
- `href` must be unique within a navigation set

**State Transitions**: 
- `isActive` changes based on current route matching
- `isEnabled` can be toggled based on user permissions or page availability

### NavigationConfig  
**Description**: Configuration object containing all navigation items and behavior settings
**Fields**:
- `items: NavigationItem[]` - Array of navigation items to display
- `position: 'top' | 'sidebar' | 'bottom'` - Where to position the navigation (default: 'top')
- `responsive: boolean` - Whether to use responsive mobile/desktop layouts (default: true)
- `showActiveIndicator: boolean` - Whether to highlight the active navigation item (default: true)

**Validation Rules**:
- `items` array must contain at least 1 item
- Each item in `items` must have unique `href`
- `position` must be one of the allowed values

### AdminPage
**Description**: Represents an admin page that includes the navigation bar
**Fields**:
- `path: string` - The URL path of the admin page
- `title: string` - Page title for display purposes
- `hasNavigation: boolean` - Whether this page should include the navigation bar (default: true)
- `requiresAuth: boolean` - Whether this page requires admin authentication (default: true)
- `isImplemented: boolean` - Whether the page functionality is fully implemented

**Validation Rules**:
- `path` must start with "/admin/"
- `title` must be non-empty string
- If `requiresAuth` is true, user must have admin role

**State Transitions**:
- `isImplemented` changes from false to true as pages are built
- Authentication state affects page accessibility

## Relationships

### NavigationItem → AdminPage
- **Type**: Many-to-One
- **Description**: Each navigation item points to one admin page via `href`
- **Cardinality**: Multiple navigation items can point to the same page (though typically one-to-one)

### NavigationConfig → NavigationItem  
- **Type**: One-to-Many
- **Description**: A navigation configuration contains multiple navigation items
- **Cardinality**: One config has 1-N items (typically 4-6 for admin pages)

## Business Rules

1. **Active State Logic**: A navigation item is active when `window.location.pathname` matches its `href`
2. **Authorization Logic**: If user lacks admin role, redirect to login with error message
3. **Missing Page Logic**: If navigation item points to unimplemented page, show "Coming Soon" placeholder
4. **Mobile Responsive Logic**: On screens <768px, navigation may collapse to hamburger menu
5. **Accessibility Logic**: Navigation items must be keyboard navigable and screen reader accessible

## Constants & Enums

### AdminRoutes
```typescript
const ADMIN_ROUTES = {
  DASHBOARD: '/admin/dashboard',
  APPLICATIONS: '/admin/applications', 
  ENROLLMENTS: '/admin/enrollments',
  PAYMENTS: '/admin/payments',
  REPORTS: '/admin/reports'
} as const;
```

### NavigationLabels
```typescript
const NAVIGATION_LABELS = {
  DASHBOARD: 'Dashboard',
  APPLICATIONS: 'Applications',
  ENROLLMENTS: 'Enrollments', 
  PAYMENTS: 'Payments',
  REPORTS: 'Reports'
} as const;
```

### UserRoles (from existing system)
```typescript
enum UserRole {
  PARENT = 'parent',
  TEACHER = 'teacher', 
  ADMIN = 'admin'
}
```

## Implementation Notes

- Navigation component should be **server-side by default** with `'use client'` only on interactive elements
- Use Next.js `usePathname()` hook for active state detection (client-side only)
- Icons should come from existing lucide-react library for consistency
- Component should integrate with existing shadcn/ui design system
- Must maintain existing page layouts and functionality when integrating