export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: 'Pending',
  [ApplicationStatus.APPROVED]: 'Approved',
  [ApplicationStatus.REJECTED]: 'Rejected'
};

export const APPLICATION_STATUS_OPTIONS = Object.values(ApplicationStatus).map(status => ({
  value: status,
  label: APPLICATION_STATUS_LABELS[status]
}));