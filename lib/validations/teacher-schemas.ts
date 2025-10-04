import { z } from 'zod';

/**
 * Schema for creating a new teacher
 */
export const createTeacherSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .trim(),
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .max(255, { message: 'Email must be less than 255 characters' })
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
    .max(100, { message: 'Password must be less than 100 characters' }),
  wage: z
    .number()
    .positive({ message: 'Wage must be a positive number' })
    .max(999999.99, { message: 'Wage must be less than 1,000,000' })
    .optional()
    .nullable(),
  nationality: z
    .string()
    .max(100, { message: 'Nationality must be less than 100 characters' })
    .trim()
    .optional()
    .nullable(),
});

/**
 * Schema for updating an existing teacher
 */
export const updateTeacherSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .trim()
    .optional(),
  email: z
    .string()
    .email({ message: 'Invalid email format' })
    .max(255, { message: 'Email must be less than 255 characters' })
    .trim()
    .toLowerCase()
    .optional(),
  wage: z
    .number()
    .positive({ message: 'Wage must be a positive number' })
    .max(999999.99, { message: 'Wage must be less than 1,000,000' })
    .optional()
    .nullable(),
  nationality: z
    .string()
    .max(100, { message: 'Nationality must be less than 100 characters' })
    .trim()
    .optional()
    .nullable(),
});

/**
 * Schema for teacher query parameters (pagination and search)
 */
export const teacherQuerySchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .default(1)
    .optional(),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .optional(),
  search: z
    .string()
    .max(200, { message: 'Search term must be less than 200 characters' })
    .optional(),
  includeInactive: z
    .boolean()
    .default(true)
    .optional(),
});

/**
 * Schema for assigning students to a teacher
 */
export const assignStudentsSchema = z.object({
  studentIds: z
    .array(z.string().uuid({ message: 'Invalid student ID format' }))
    .min(1, { message: 'At least one student must be selected' })
    .max(100, { message: 'Cannot assign more than 100 students at once' }),
});

/**
 * Inferred types from schemas
 */
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type TeacherQueryParams = z.infer<typeof teacherQuerySchema>;
export type AssignStudentsInput = z.infer<typeof assignStudentsSchema>;
