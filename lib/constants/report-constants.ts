export const REPORT_TYPES = {
  APPLICATIONS: 'applications',
  ENROLLMENTS: 'enrollments',
  PAYMENTS: 'payments',
  ACTIVITY: 'activity'
} as const;

export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  PDF: 'pdf'
} as const;

export const REPORT_LIMITS = {
  MAX_RECORDS: 10000,
  MAX_DATE_RANGE_YEARS: 2,
  TIMEOUT_SECONDS: 30,
  TARGET_RESPONSE_TIME_MS: 2000
} as const;

export const CSV_SETTINGS = {
  DELIMITER: ',',
  ENCODING: 'utf-8',
  INCLUDE_BOM: true,
  QUOTE_CHAR: '"'
} as const;

export const PDF_SETTINGS = {
  FORMAT: 'a4',
  MARGIN: 20,
  ORIENTATION: 'portrait',
  UNITS: 'mm'
} as const;

export type ReportType = typeof REPORT_TYPES[keyof typeof REPORT_TYPES];
export type ExportFormat = typeof EXPORT_FORMATS[keyof typeof EXPORT_FORMATS];