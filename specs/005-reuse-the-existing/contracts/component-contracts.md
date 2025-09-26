# Component Contracts: Admin Navigation

## AdminNavigation Component

### Interface Contract
```typescript
interface AdminNavigationProps {
  currentPath?: string; // Optional override for active path detection
  className?: string;   // Optional additional CSS classes
}

interface AdminNavigationState {
  isMobileMenuOpen: boolean; // For responsive mobile menu toggle
}
```

### Behavior Contract

#### Props Handling
- **Input**: `currentPath` (optional) - If provided, uses this instead of `usePathname()` for active detection
- **Input**: `className` (optional) - Additional CSS classes applied to navigation container
- **Default**: No required props, component is self-sufficient

#### State Management
- **Mobile Menu**: `isMobileMenuOpen` toggles mobile hamburger menu visibility
- **Active Detection**: Automatically detects active route using Next.js `usePathname()` hook
- **Responsive Behavior**: Automatically adapts layout based on screen size

#### Event Handling
- **Navigation Click**: Handles clicks on navigation items with Next.js Link routing
- **Mobile Toggle**: Handles hamburger menu open/close on mobile devices
- **Keyboard Navigation**: Supports Tab key navigation and Enter key activation

#### Error Handling
- **Invalid Route**: If navigation item href is invalid, fallback to dashboard
- **Auth Error**: If user not authorized, component triggers redirect to login
- **Missing Page**: If route exists but page not implemented, shows "Coming Soon"

### Output Contract

#### Rendered Structure
```html
<nav className="admin-navigation">
  <div className="navigation-container">
    <!-- Desktop Navigation -->
    <div className="desktop-nav hidden md:flex">
      <a href="/admin/dashboard" className="nav-item active">Dashboard</a>
      <a href="/admin/applications" className="nav-item">Applications</a>
      <a href="/admin/enrollments" className="nav-item">Enrollments</a>
      <a href="/admin/payments" className="nav-item">Payments</a>
      <a href="/admin/reports" className="nav-item">Reports</a>
    </div>
    
    <!-- Mobile Navigation -->
    <div className="mobile-nav md:hidden">
      <button className="mobile-toggle">Menu</button>
      <div className="mobile-menu hidden">
        <!-- Same nav items as desktop -->
      </div>
    </div>
  </div>
</nav>
```

#### CSS Classes Applied
- `.admin-navigation` - Root navigation container
- `.nav-item` - Individual navigation link
- `.nav-item.active` - Currently active navigation item
- `.desktop-nav` - Desktop navigation container (hidden on mobile)
- `.mobile-nav` - Mobile navigation container (hidden on desktop)
- `.mobile-menu` - Mobile dropdown menu container

#### Accessibility Attributes
- `role="navigation"` on root nav element
- `aria-current="page"` on active navigation item
- `aria-expanded` on mobile menu toggle button
- `aria-label` on navigation container for screen readers

## PlaceholderPage Component

### Interface Contract
```typescript
interface PlaceholderPageProps {
  pageName: string;     // Name of the coming soon page (e.g., "Enrollments")
  expectedDate?: string; // Optional expected completion date
}
```

### Behavior Contract

#### Props Handling  
- **Input**: `pageName` (required) - Display name for the placeholder page
- **Input**: `expectedDate` (optional) - When the page is expected to be available

#### Output Contract
```html
<div className="placeholder-page">
  <div className="placeholder-content">
    <h1>{{pageName}} - Coming Soon</h1>
    <p>This feature is currently under development.</p>
    <!-- Navigation component included at top -->
    <AdminNavigation />
  </div>
</div>
```

## Route Protection Contract

### Middleware Behavior
- **Authentication Check**: Verify user has valid session
- **Authorization Check**: Verify user has admin role
- **Failure Response**: Redirect to `/sign-in?redirect=/admin/[original-path]&error=unauthorized`

### Protected Routes
- `/admin/dashboard` - Requires admin role
- `/admin/applications` - Requires admin role  
- `/admin/enrollments` - Requires admin role (placeholder)
- `/admin/payments` - Requires admin role (placeholder)
- `/admin/reports` - Requires admin role (placeholder)

## Integration Contract

### Layout Integration
- **Position**: Navigation renders at top of page before main content
- **Layout Preservation**: Existing page layouts remain unchanged below navigation
- **Styling Consistency**: Uses existing Tailwind classes and shadcn/ui components

### Next.js App Router Integration
- **Server Components**: Main navigation logic runs server-side
- **Client Components**: Interactive elements (mobile toggle, active detection) use `'use client'`
- **Routing**: Uses Next.js Link components for client-side navigation
- **Path Detection**: Uses `usePathname()` hook for active state detection