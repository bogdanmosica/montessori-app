import React from 'react';
import { auth } from '@/lib/auth/config';
import { redirect } from 'next/navigation';
import { requireAdminPermissions } from '@/lib/auth/dashboard-context';
import AdminNavigation from '@/components/admin/admin-navigation';
import PaymentsDashboard from './components/payments-dashboard';

export default async function PaymentsPage() {
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
    <div className="min-h-screen bg-gray-50/30">
      <AdminNavigation />
      <main className="container mx-auto px-4 py-8">
        <PaymentsDashboard />
      </main>
    </div>
  );
}