'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/lib/constants/user-roles';

interface TeacherGuardProps {
  children: React.ReactNode;
  userRole?: string;
}

export default function TeacherGuard({ children, userRole }: TeacherGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (!userRole) {
      router.push('/sign-in');
    } else if (userRole !== UserRole.TEACHER) {
      router.push('/unauthorized');
    }
  }, [userRole, router]);

  // Only render children if user has teacher role
  if (userRole === UserRole.TEACHER) {
    return <>{children}</>;
  }

  return null;
}
