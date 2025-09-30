'use client';

import * as React from 'react';
import { formatFeeDisplay, FREE_ENROLLMENT_TEXT, NO_FEE_SET_TEXT } from '@/lib/constants/currency';
import { cn } from '@/lib/utils';

export interface FeeDisplayProps {
  /**
   * Fee amount in cents
   */
  feeCents: number | null | undefined;
  /**
   * Display format
   */
  format?: 'default' | 'compact' | 'full';
  /**
   * Show badge style
   */
  showBadge?: boolean;
  /**
   * Override text for zero/null fees
   */
  emptyText?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Show currency symbol
   */
  showCurrency?: boolean;
}

/**
 * Fee display component for showing fee amounts
 * Handles formatting and display of fees in RON
 */
export const FeeDisplay: React.FC<FeeDisplayProps> = ({
  feeCents,
  format = 'default',
  showBadge = false,
  emptyText,
  className,
  showCurrency = true,
}) => {
  const getDisplayText = (): string => {
    if (feeCents === null || feeCents === undefined) {
      return emptyText || NO_FEE_SET_TEXT;
    }

    if (feeCents === 0) {
      return emptyText || FREE_ENROLLMENT_TEXT;
    }

    const formattedFee = formatFeeDisplay(feeCents);

    switch (format) {
      case 'compact':
        // Remove spaces for compact display
        return formattedFee.replace(/\s/g, '');
      case 'full':
        // Add "Monthly fee:" prefix
        return `Monthly fee: ${formattedFee}`;
      default:
        return formattedFee;
    }
  };

  const displayText = getDisplayText();
  const isZeroOrNull = feeCents === null || feeCents === undefined || feeCents === 0;

  if (showBadge) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          isZeroOrNull
            ? 'bg-gray-100 text-gray-800'
            : 'bg-green-100 text-green-800',
          className
        )}
      >
        {displayText}
      </span>
    );
  }

  return (
    <span className={cn('text-sm', isZeroOrNull && 'text-gray-500', className)}>
      {displayText}
    </span>
  );
};

/**
 * Fee comparison display component
 * Shows override vs default fee
 */
export interface FeeComparisonProps {
  defaultFeeCents: number;
  overrideFeeCents: number | null;
  className?: string;
}

export const FeeComparison: React.FC<FeeComparisonProps> = ({
  defaultFeeCents,
  overrideFeeCents,
  className,
}) => {
  const hasOverride = overrideFeeCents !== null && overrideFeeCents !== undefined;
  const effectiveFee = hasOverride ? overrideFeeCents : defaultFeeCents;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Default fee:</span>
        <FeeDisplay feeCents={defaultFeeCents} />
      </div>
      {hasOverride && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Override:</span>
            <FeeDisplay feeCents={overrideFeeCents} showBadge />
          </div>
          <div className="flex items-center justify-between border-t pt-1 font-medium">
            <span>Effective fee:</span>
            <FeeDisplay feeCents={effectiveFee} />
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Fee badge component for quick display
 */
export interface FeeBadgeProps {
  feeCents: number | null | undefined;
  showFree?: boolean;
  className?: string;
}

export const FeeBadge: React.FC<FeeBadgeProps> = ({
  feeCents,
  showFree = true,
  className,
}) => {
  if (feeCents === null || feeCents === undefined || (feeCents === 0 && !showFree)) {
    return null;
  }

  return (
    <FeeDisplay
      feeCents={feeCents}
      format="compact"
      showBadge
      className={className}
    />
  );
};