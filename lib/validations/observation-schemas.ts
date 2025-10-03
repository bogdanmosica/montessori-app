import { z } from 'zod';
import { OBSERVATION_CONSTANTS, OBSERVATION_MESSAGES } from '@/lib/constants/observations';

/**
 * Schema for creating a new observation
 */
export const createObservationSchema = z.object({
  note: z
    .string()
    .min(OBSERVATION_CONSTANTS.MIN_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_SHORT,
    })
    .max(OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_LONG,
    })
    .trim(),
});

/**
 * Schema for updating an existing observation
 */
export const updateObservationSchema = z.object({
  note: z
    .string()
    .min(OBSERVATION_CONSTANTS.MIN_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_SHORT,
    })
    .max(OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH, {
      message: OBSERVATION_MESSAGES.NOTE_TOO_LONG,
    })
    .trim(),
});

/**
 * Schema for observation query parameters (pagination)
 */
export const observationQuerySchema = z.object({
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
    .max(OBSERVATION_CONSTANTS.MAX_PAGE_SIZE)
    .default(OBSERVATION_CONSTANTS.DEFAULT_PAGE_SIZE)
    .optional(),
  searchTerm: z
    .string()
    .max(200)
    .optional(),
});

/**
 * Inferred types from schemas
 */
export type CreateObservationInput = z.infer<typeof createObservationSchema>;
export type UpdateObservationInput = z.infer<typeof updateObservationSchema>;
export type ObservationQueryParams = z.infer<typeof observationQuerySchema>;
