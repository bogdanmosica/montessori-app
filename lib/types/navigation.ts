import { ReactElement } from 'react';

export interface NavigationItem {
  href: string;
  label: string;
  icon: ReactElement;
  isActive?: boolean;
  isEnabled: boolean;
}

export interface NavigationConfig {
  items: NavigationItem[];
  position: 'top' | 'sidebar' | 'bottom';
  responsive: boolean;
  showActiveIndicator: boolean;
}

export interface AdminPage {
  path: string;
  title: string;
  hasNavigation: boolean;
  requiresAuth: boolean;
  isImplemented: boolean;
}

export interface AdminNavigationProps {
  currentPath?: string;
  className?: string;
}

export interface AdminNavigationState {
  isMobileMenuOpen: boolean;
}

export interface PlaceholderPageProps {
  pageName: string;
  expectedDate?: string;
}