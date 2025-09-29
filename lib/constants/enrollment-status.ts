export enum EnrollmentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  GRADUATED = 'graduated',
  WITHDRAWN = 'withdrawn',
  SUSPENDED = 'suspended'
}

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: 'Active',
  [EnrollmentStatus.INACTIVE]: 'Inactive',
  [EnrollmentStatus.GRADUATED]: 'Graduated',
  [EnrollmentStatus.WITHDRAWN]: 'Withdrawn',
  [EnrollmentStatus.SUSPENDED]: 'Suspended'
};

export const ENROLLMENT_STATUS_OPTIONS = Object.values(EnrollmentStatus).map(status => ({
  value: status,
  label: ENROLLMENT_STATUS_LABELS[status]
}));