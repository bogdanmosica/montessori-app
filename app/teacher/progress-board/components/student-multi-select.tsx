'use client';

/**
 * Student Multi-Select Component
 *
 * Multi-select dropdown with checkboxes for student selection
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
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  name: string;
}

interface StudentMultiSelectProps {
  students: Student[];
  value: string[]; // Array of selected student IDs
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  includeUnassigned?: boolean;
}

export function StudentMultiSelect({
  students,
  value,
  onValueChange,
  placeholder = 'Select students...',
  includeUnassigned = true,
}: StudentMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleToggle = (studentId: string) => {
    if (studentId === 'unassigned') {
      // Unassigned is mutually exclusive - clear all selections
      onValueChange([]);
    } else {
      // Remove 'unassigned' if selecting a student
      const newValue = value.filter(id => id !== 'unassigned');

      if (newValue.includes(studentId)) {
        // Remove student
        onValueChange(newValue.filter(id => id !== studentId));
      } else {
        // Add student
        onValueChange([...newValue, studentId]);
      }
    }
  };

  const selectedStudents = React.useMemo(() => {
    if (value.length === 0 || value.includes('unassigned')) {
      return 'Unassigned';
    }
    return students
      .filter(s => value.includes(s.id))
      .map(s => s.name);
  }, [value, students]);

  const displayText = React.useMemo(() => {
    if (value.length === 0 || value.includes('unassigned')) {
      return 'Unassigned (template)';
    }
    if (Array.isArray(selectedStudents)) {
      if (selectedStudents.length === 0) return placeholder;
      if (selectedStudents.length === 1) return selectedStudents[0];
      return `${selectedStudents.length} students selected`;
    }
    return selectedStudents;
  }, [selectedStudents, value.length, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{displayText}</span>
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
                  onSelect={() => handleToggle('unassigned')}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      (value.length === 0 || value.includes('unassigned'))
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className="h-3 w-3" />
                    </div>
                    <UserX className="h-4 w-4 text-gray-400" />
                    <span>Unassigned (template)</span>
                  </div>
                </CommandItem>
              )}
              {students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={student.name}
                  onSelect={() => handleToggle(student.id)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      value.includes(student.id)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}>
                      <Check className="h-3 w-3" />
                    </div>
                    <span>{student.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>

      {/* Selected badges below the button */}
      {value.length > 0 && !value.includes('unassigned') && Array.isArray(selectedStudents) && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedStudents.map((name, index) => (
            <Badge key={value[index]} variant="secondary" className="text-xs">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </Popover>
  );
}
