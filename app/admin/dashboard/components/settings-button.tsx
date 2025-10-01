'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

/**
 * Client component for navigation to settings page
 * Allows admin to access school configuration settings
 */
export function SettingsButton() {
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label="Go to settings"
    >
      <Link href="/admin/dashboard/settings">
        <Settings className="h-4 w-4" />
        Settings
      </Link>
    </Button>
  );
}