'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
// import { useDebouncedCallback } from 'use-debounce';

interface ApplicationSearchProps {
  currentSearch?: string;
}

export function ApplicationSearch({ currentSearch }: ApplicationSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentSearch || '');

  // Simple search without debouncing for now
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (term.trim()) {
      params.set('search', term.trim());
    } else {
      params.delete('search');
    }

    // Reset to first page when searching
    params.set('page', '1');

    router.push(`?${params.toString()}`);
  };

  // Update search value when currentSearch prop changes
  useEffect(() => {
    setSearchValue(currentSearch || '');
  }, [currentSearch]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // For now, search on enter or with a simple timeout
    if (value.length === 0 || value.length >= 3) {
      handleSearch(value);
    }
  };

  const clearSearch = () => {
    setSearchValue('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('search');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by child or parent name..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 hover:bg-muted"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {searchValue && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-muted-foreground">
          Searching for "{searchValue}"...
        </div>
      )}
    </div>
  );
}