'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FeeInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  value?: number | null;
  onChange?: (value: number | null) => void;
  error?: string;
  helperText?: string;
  currency?: string;
}

/**
 * Fee input component for RON amounts
 * Handles conversion between user input and numeric values
 */
export const FeeInput = React.forwardRef<HTMLInputElement, FeeInputProps>(
  ({ label, value, onChange, error, helperText, currency = 'RON', className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');

    // Sync display value with prop value
    React.useEffect(() => {
      if (value === null || value === undefined) {
        setDisplayValue('');
      } else {
        setDisplayValue(value.toString());
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setDisplayValue(input);

      // Allow empty input
      if (input === '') {
        onChange?.(null);
        return;
      }

      // Parse number (handle both comma and dot as decimal separator)
      const cleanedInput = input.replace(/[^\d.,]/g, '');
      const normalized = cleanedInput.replace(',', '.');
      const parsed = parseFloat(normalized);

      if (!isNaN(parsed)) {
        onChange?.(parsed);
      }
    };

    const handleBlur = () => {
      // Format the value on blur
      if (value !== null && value !== undefined && !isNaN(value)) {
        setDisplayValue(value.toFixed(2));
      }
    };

    return (
      <div className={cn('space-y-2', className)}>
        {label && <Label htmlFor={props.id}>{label}</Label>}
        <div className="relative">
          <Input
            {...props}
            ref={ref}
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            className={cn(
              'pr-14',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${props.id}-error` : helperText ? `${props.id}-helper` : undefined
            }
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {currency}
          </span>
        </div>
        {error && (
          <p id={`${props.id}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${props.id}-helper`} className="text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FeeInput.displayName = 'FeeInput';