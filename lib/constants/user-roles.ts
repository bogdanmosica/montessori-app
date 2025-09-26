export enum UserRole {
  PARENT = 'parent',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export const USER_ROLE_LABELS = {
  [UserRole.PARENT]: 'Parent',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.ADMIN]: 'Administrator'
} as const;

export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};