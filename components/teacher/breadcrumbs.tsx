'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { TEACHER_ROUTES, TEACHER_NAVIGATION_LABELS } from '@/lib/constants/teacher-routes';

export default function TeacherBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbMap: Record<string, string> = {
    [TEACHER_ROUTES.DASHBOARD]: TEACHER_NAVIGATION_LABELS.DASHBOARD,
    [TEACHER_ROUTES.STUDENTS]: TEACHER_NAVIGATION_LABELS.STUDENTS
  };

  const breadcrumbLabel = breadcrumbMap[pathname] || 'Unknown';

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      <Link
        href={TEACHER_ROUTES.DASHBOARD}
        className="hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {pathname !== TEACHER_ROUTES.DASHBOARD && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">{breadcrumbLabel}</span>
        </>
      )}
    </nav>
  );
}
