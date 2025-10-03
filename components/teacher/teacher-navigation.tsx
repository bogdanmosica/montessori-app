'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TEACHER_ROUTES, TEACHER_NAVIGATION_LABELS } from '@/lib/constants/teacher-routes';
import {
  LayoutDashboard,
  Users,
  Menu,
  X,
  Home,
  LogOut,
  Kanban,
  ClipboardCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!user) {
    return <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />;
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isEnabled: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    href: TEACHER_ROUTES.DASHBOARD,
    label: TEACHER_NAVIGATION_LABELS.DASHBOARD,
    icon: <LayoutDashboard className="h-4 w-4" />,
    isEnabled: true
  },
  {
    href: TEACHER_ROUTES.STUDENTS,
    label: TEACHER_NAVIGATION_LABELS.STUDENTS,
    icon: <Users className="h-4 w-4" />,
    isEnabled: true
  },
  {
    href: TEACHER_ROUTES.ATTENDANCE,
    label: TEACHER_NAVIGATION_LABELS.ATTENDANCE,
    icon: <ClipboardCheck className="h-4 w-4" />,
    isEnabled: true
  },
  {
    href: TEACHER_ROUTES.PROGRESS_BOARD,
    label: TEACHER_NAVIGATION_LABELS.PROGRESS_BOARD,
    icon: <Kanban className="h-4 w-4" />,
    isEnabled: true
  }
];

interface TeacherNavigationProps {
  currentPath?: string;
  className?: string;
}

export default function TeacherNavigation({ currentPath, className = '' }: TeacherNavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activePath = currentPath || pathname;

  const isActiveRoute = (href: string) => {
    return activePath === href;
  };

  return (
    <nav className={`teacher-navigation bg-white border-b border-gray-200 ${className}`} role="navigation" aria-label="Teacher navigation">
      <div className="container mx-auto px-4">
        {/* Desktop Navigation */}
        <div className="desktop-nav hidden md:flex items-center justify-between py-4">
          <div className="flex space-x-2">
            {navigationItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={isActiveRoute(item.href) ? "default" : "outline"}
                size="sm"
                className={`nav-item flex items-center space-x-2 ${
                  isActiveRoute(item.href) ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                }`}
                aria-current={isActiveRoute(item.href) ? "page" : undefined}
              >
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </div>
          <div className="flex items-center">
            <Suspense fallback={<div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />}>
              <UserMenu />
            </Suspense>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="mobile-nav md:hidden">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-lg font-semibold text-gray-900">Teacher</h1>
            <div className="flex items-center space-x-2">
              <Suspense fallback={<div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse" />}>
                <UserMenu />
              </Suspense>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-toggle"
                aria-expanded={isMobileMenuOpen}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`mobile-menu ${isMobileMenuOpen ? 'block' : 'hidden'} pb-4`}>
            <Card className="p-2">
              <div className="space-y-1">
                {navigationItems.map((item) => (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActiveRoute(item.href) ? "default" : "ghost"}
                    size="sm"
                    className={`nav-item w-full justify-start ${
                      isActiveRoute(item.href) ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    aria-current={isActiveRoute(item.href) ? "page" : undefined}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link href={item.href} className="flex items-center space-x-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </nav>
  );
}
