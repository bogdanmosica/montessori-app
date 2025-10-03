'use client';

/**
 * Student Combobox Component
 *
 * Searchable dropdown for student selection
 */

import * as React from 'react';
import { Check, ChevronsUpDown, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Student {
  id: string;
  name: string;
}

interface StudentComboboxProps {
  students: Student[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeUnassigned?: boolean;
}

export function StudentCombobox({
  students,
  value,
  onValueChange,
  placeholder = 'Select student...',
  includeUnassigned = true,
}: StudentComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedStudent = React.useMemo(() => {
    if (value === 'unassigned') return 'Unassigned (template)';
    return students.find((student) => student.id === value)?.name || placeholder;
  }, [value, students, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedStudent}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search students..." />
          <CommandList>
            <CommandEmpty>No student found.</CommandEmpty>
            <CommandGroup>
              {includeUnassigned && (
                <CommandItem
                  value="unassigned"
                  onSelect={() => {
                    onValueChange('unassigned');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === 'unassigned' ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <UserX className="mr-2 h-4 w-4 text-gray-400" />
                  Unassigned (template)
                </CommandItem>
              )}
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={student.name}
                  onSelect={() => {
                    onValueChange(student.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === student.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {student.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
