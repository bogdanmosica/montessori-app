'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';

interface RBACGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
  showError?: boolean;
}

export default function RBACGuard({
  children,
  allowedRoles,
  fallbackPath = '/unauthorized',
  showError = false
}: RBACGuardProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && (!user || !allowedRoles.includes(user.role))) {
      router.push(fallbackPath);
    }
  }, [user, isLoading, allowedRoles, fallbackPath, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    if (showError) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600 mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this resource.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}