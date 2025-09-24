/**
 * Unit tests for UserRole enum validation
 */

import { UserRole, USER_ROLE_LABELS, isValidUserRole } from '@/lib/constants/user-roles';

describe('UserRole Enum', () => {
  it('should have correct enum values', () => {
    expect(UserRole.PARENT).toBe('parent');
    expect(UserRole.TEACHER).toBe('teacher');
    expect(UserRole.ADMIN).toBe('admin');
  });

  it('should have correct role labels', () => {
    expect(USER_ROLE_LABELS[UserRole.PARENT]).toBe('Parent');
    expect(USER_ROLE_LABELS[UserRole.TEACHER]).toBe('Teacher');
    expect(USER_ROLE_LABELS[UserRole.ADMIN]).toBe('Administrator');
  });

  it('should validate valid user roles', () => {
    expect(isValidUserRole('parent')).toBe(true);
    expect(isValidUserRole('teacher')).toBe(true);
    expect(isValidUserRole('admin')).toBe(true);
  });

  it('should reject invalid user roles', () => {
    expect(isValidUserRole('invalid')).toBe(false);
    expect(isValidUserRole('owner')).toBe(false);
    expect(isValidUserRole('member')).toBe(false);
    expect(isValidUserRole('')).toBe(false);
    expect(isValidUserRole('ADMIN')).toBe(false); // Case sensitive
    expect(isValidUserRole('Parent')).toBe(false); // Case sensitive
  });

  it('should handle null and undefined values', () => {
    expect(isValidUserRole(null as any)).toBe(false);
    expect(isValidUserRole(undefined as any)).toBe(false);
  });

  it('should have all enum values covered in labels', () => {
    const enumValues = Object.values(UserRole);
    const labelKeys = Object.keys(USER_ROLE_LABELS);

    expect(enumValues.length).toBe(labelKeys.length);

    enumValues.forEach(role => {
      expect(USER_ROLE_LABELS[role]).toBeDefined();
    });
  });

  it('should use consistent string values', () => {
    // Ensure enum values match what we expect for database storage
    expect(typeof UserRole.PARENT).toBe('string');
    expect(typeof UserRole.TEACHER).toBe('string');
    expect(typeof UserRole.ADMIN).toBe('string');
  });
});