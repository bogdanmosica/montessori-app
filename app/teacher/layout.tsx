/**
 * Teacher Layout
 *
 * Wraps all teacher pages with navigation
 */

import TeacherNavigation from '@/components/teacher/teacher-navigation';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <TeacherNavigation />
      {children}
    </div>
  );
}
