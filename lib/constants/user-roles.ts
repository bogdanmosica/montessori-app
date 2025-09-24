export enum UserRole {
  PARENT = 'parent',
  TEACHER = 'teacher',
  ADMIN = 'admin',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export const USER_ROLE_LABELS = {
  [UserRole.PARENT]: 'Parent',
  [UserRole.TEACHER]: 'Teacher',
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.SUPER_ADMIN]: 'Super Administrator'
} as const;

export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};