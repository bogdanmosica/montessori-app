'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Client component for dashboard refresh functionality
 * Allows admin to manually reload dashboard metrics
 */
export function RefreshButton() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Refresh the current route to trigger server component re-render
      router.refresh();

      // Show success feedback after a brief delay
      setTimeout(() => {
        toast({
          title: 'Dashboard Refreshed',
          description: 'Metrics have been updated successfully.',
        });
        setIsRefreshing(false);
      }, 500);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Unable to refresh dashboard. Please try again.',
        variant: 'destructive',
      });
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label="Refresh dashboard"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </Button>
  );
}