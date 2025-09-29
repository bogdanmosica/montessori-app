export enum ActivityType {
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPLICATION_CREATE = 'application_create',
  APPLICATION_APPROVE = 'application_approve',
  APPLICATION_REJECT = 'application_reject',
  ENROLLMENT_CREATE = 'enrollment_create',
  ENROLLMENT_UPDATE = 'enrollment_update',
  PAYMENT_PROCESS = 'payment_process',
  REPORT_GENERATE = 'report_generate'
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.LOGIN]: 'User Login',
  [ActivityType.LOGOUT]: 'User Logout',
  [ActivityType.APPLICATION_CREATE]: 'Application Created',
  [ActivityType.APPLICATION_APPROVE]: 'Application Approved',
  [ActivityType.APPLICATION_REJECT]: 'Application Rejected',
  [ActivityType.ENROLLMENT_CREATE]: 'Enrollment Created',
  [ActivityType.ENROLLMENT_UPDATE]: 'Enrollment Updated',
  [ActivityType.PAYMENT_PROCESS]: 'Payment Processed',
  [ActivityType.REPORT_GENERATE]: 'Report Generated'
};

export const ACTIVITY_TYPE_OPTIONS = Object.values(ActivityType).map(type => ({
  value: type,
  label: ACTIVITY_TYPE_LABELS[type]
}));