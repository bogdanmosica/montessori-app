/**
 * Currency constants and formatting utilities for Monte SMS
 * All fees are stored in cents (integer) to avoid floating-point precision issues
 */

/**
 * Supported currencies
 * Currently only RON (Romanian Leu) is supported
 */
export const SUPPORTED_CURRENCIES = ['RON'] as const;
export type Currency = typeof SUPPORTED_CURRENCIES[number];

/**
 * Default currency for the application
 */
export const DEFAULT_CURRENCY: Currency = 'RON';

/**
 * Maximum fee allowed in RON
 * 10,000 RON = 1,000,000 cents
 */
export const MAX_FEE_RON = 10000;
export const MAX_FEE_CENTS = MAX_FEE_RON * 100;

/**
 * Minimum fee allowed in RON
 * 0 RON = 0 cents (free enrollment)
 */
export const MIN_FEE_RON = 0;
export const MIN_FEE_CENTS = MIN_FEE_RON * 100;

/**
 * Fee limits object for backward compatibility
 */
export const FEE_LIMITS = {
  MIN_FEE_RON,
  MAX_FEE_RON,
  MIN_FEE_CENTS,
  MAX_FEE_CENTS,
} as const;

/**
 * Format fee amount in cents to display string with currency
 * @param cents - Fee amount in cents
 * @param currency - Currency code (default: RON)
 * @returns Formatted string like "1,250 RON"
 */
export function formatFee(cents: number, currency: Currency = DEFAULT_CURRENCY): string {
  const ron = cents / 100;
  return `${ron.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

/**
 * Parse fee input string to cents
 * @param ronAmount - Fee amount as string (e.g., "1250" or "1,250.50")
 * @returns Fee amount in cents
 */
export function parseFeeInput(ronAmount: string): number {
  const cleaned = ronAmount.replace(/[^\d.,]/g, '');
  const ron = parseFloat(cleaned.replace(',', '.'));
  return Math.round(ron * 100);
}

/**
 * Convert cents to RON
 * @param cents - Fee amount in cents
 * @returns Fee amount in RON
 */
export function centsToRon(cents: number): number {
  return cents / 100;
}

/**
 * Convert RON to cents
 * @param ron - Fee amount in RON
 * @returns Fee amount in cents
 */
export function ronToCents(ron: number): number {
  return Math.round(ron * 100);
}

/**
 * Display text for zero fee
 */
export const FREE_ENROLLMENT_TEXT = 'Free enrollment';

/**
 * Display text for no fee set
 */
export const NO_FEE_SET_TEXT = 'No fee set';

/**
 * Format fee for display (alias for formatFee)
 * @param cents - Fee amount in cents
 * @returns Formatted string like "1,250 RON"
 */
export function formatFeeDisplay(cents: number): string {
  return formatFee(cents);
}

/**
 * Get no fee display text
 * @returns Text for no fee scenarios
 */
export function getNoFeeDisplay(): string {
  return FREE_ENROLLMENT_TEXT;
}

/**
 * Validate fee amount
 * @param cents - Fee amount in cents
 * @returns true if valid, false otherwise
 */
export function isValidFeeAmount(cents: number): boolean {
  return Number.isFinite(cents) && cents >= MIN_FEE_CENTS && cents <= MAX_FEE_CENTS;
}