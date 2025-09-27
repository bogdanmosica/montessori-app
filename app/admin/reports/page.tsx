import React from 'react';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import AdminNavigation from '@/components/admin/admin-navigation';
import PlaceholderPage from '@/components/admin/placeholder-page';

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  try {
    requireAdminPermissions(session.user.role);
  } catch {
    redirect('/unauthorized');
  }

  return (
    <>
      <AdminNavigation />
      <PlaceholderPage pageName="Reports" expectedDate="Q1 2026" />
    </>
  );
}