export enum ActivityType {
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',
  SIGN_OUT = 'sign_out',
  UPDATE_PASSWORD = 'update_password',
  DELETE_ACCOUNT = 'delete_account',
  UPDATE_ACCOUNT = 'update_account',
  CREATE_TEAM = 'create_team',
  REMOVE_TEAM_MEMBER = 'remove_team_member',
  INVITE_TEAM_MEMBER = 'invite_team_member',
  ACCEPT_INVITATION = 'accept_invitation',
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
  [ActivityType.SIGN_UP]: 'Sign Up',
  [ActivityType.SIGN_IN]: 'Sign In',
  [ActivityType.SIGN_OUT]: 'Sign Out',
  [ActivityType.UPDATE_PASSWORD]: 'Update Password',
  [ActivityType.DELETE_ACCOUNT]: 'Delete Account',
  [ActivityType.UPDATE_ACCOUNT]: 'Update Account',
  [ActivityType.CREATE_TEAM]: 'Create Team',
  [ActivityType.REMOVE_TEAM_MEMBER]: 'Remove Team Member',
  [ActivityType.INVITE_TEAM_MEMBER]: 'Invite Team Member',
  [ActivityType.ACCEPT_INVITATION]: 'Accept Invitation',
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

// Trend Widget Activity Types
export type TrendActivityType =
  | 'applications'
  | 'enrollments'
  | 'payments'
  | 'staff_activities'
  | 'events';

export const TREND_ACTIVITY_TYPES: TrendActivityType[] = [
  'applications',
  'enrollments',
  'payments',
  'staff_activities',
  'events'
];

export const TREND_ACTIVITY_LABELS: Record<TrendActivityType, string> = {
  applications: 'Applications',
  enrollments: 'Enrollments',
  payments: 'Payments',
  staff_activities: 'Staff Activities',
  events: 'Events'
};

export const TREND_ACTIVITY_COLORS: Record<TrendActivityType, string> = {
  applications: '#3b82f6', // blue
  enrollments: '#10b981', // green
  payments: '#f59e0b', // amber
  staff_activities: '#8b5cf6', // purple
  events: '#ec4899' // pink
};

// Staff Activity Types
export enum StaffActivityType {
  HIRE = 'hire',
  PROMOTION = 'promotion',
  TRAINING = 'training',
  EVALUATION = 'evaluation',
  DEPARTURE = 'departure'
}

export const STAFF_ACTIVITY_LABELS: Record<StaffActivityType, string> = {
  [StaffActivityType.HIRE]: 'New Hire',
  [StaffActivityType.PROMOTION]: 'Promotion',
  [StaffActivityType.TRAINING]: 'Training',
  [StaffActivityType.EVALUATION]: 'Evaluation',
  [StaffActivityType.DEPARTURE]: 'Departure'
};

// Event Types
export enum EventType {
  MEETING = 'meeting',
  CEREMONY = 'ceremony',
  TRAINING = 'training',
  SOCIAL = 'social',
  ACADEMIC = 'academic'
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.MEETING]: 'Meeting',
  [EventType.CEREMONY]: 'Ceremony',
  [EventType.TRAINING]: 'Training',
  [EventType.SOCIAL]: 'Social Event',
  [EventType.ACADEMIC]: 'Academic Event'
};

// Payment Activity Types (extending existing payment tracking)
export enum PaymentActivityType {
  TUITION = 'tuition',
  REGISTRATION = 'registration',
  MATERIALS = 'materials',
  OTHER = 'other'
}

export const PAYMENT_ACTIVITY_LABELS: Record<PaymentActivityType, string> = {
  [PaymentActivityType.TUITION]: 'Tuition',
  [PaymentActivityType.REGISTRATION]: 'Registration Fee',
  [PaymentActivityType.MATERIALS]: 'Materials Fee',
  [PaymentActivityType.OTHER]: 'Other'
};