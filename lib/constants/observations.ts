// Observation-related constants

export const OBSERVATION_CONSTANTS = {
  MAX_NOTE_LENGTH: 5000,
  MIN_NOTE_LENGTH: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  RECENT_OBSERVATIONS_LIMIT: 5,
} as const;

export const OBSERVATION_MESSAGES = {
  EMPTY_STATE: 'No observations yet. Start by adding your first observation about this student.',
  CREATE_SUCCESS: 'Observation created successfully',
  UPDATE_SUCCESS: 'Observation updated successfully',
  DELETE_NOT_ALLOWED: 'Observations cannot be deleted for audit purposes',
  NOTE_TOO_SHORT: 'Observation note cannot be empty',
  NOTE_TOO_LONG: `Observation note cannot exceed ${OBSERVATION_CONSTANTS.MAX_NOTE_LENGTH} characters`,
  UNAUTHORIZED_ACCESS: 'You do not have permission to view this student',
  STUDENT_NOT_FOUND: 'Student not found',
  OBSERVATION_NOT_FOUND: 'Observation not found',
} as const;

export type ObservationConstantKey = keyof typeof OBSERVATION_CONSTANTS;
export type ObservationMessageKey = keyof typeof OBSERVATION_MESSAGES;
