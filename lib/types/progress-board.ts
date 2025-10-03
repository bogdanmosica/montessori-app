import { LessonProgressStatus } from '@/lib/constants/lesson-progress';

/**
 * Progress Card Type
 * Represents a lesson progress card on the Kanban board
 */
export interface ProgressCard {
  id: string;
  lessonId: string;
  lessonTitle: string;
  lessonCategory: string;
  studentId: string | null;
  studentName: string | null;
  status: LessonProgressStatus;
  position: number;
  lockedBy: string | null;
  lockedAt: Date | null;
  updatedAt: Date;
}

/**
 * Progress Column Type
 * Represents a column on the progress board
 */
export interface ProgressColumn {
  id: string;
  name: string;
  statusValue: LessonProgressStatus;
  position: number;
  color: string;
  cards: ProgressCard[];
}

/**
 * Drag and Drop Types
 */
export interface DragItem {
  type: 'PROGRESS_CARD';
  cardId: string;
  sourceStatus: LessonProgressStatus;
  sourcePosition: number;
}

export interface DropResult {
  targetStatus: LessonProgressStatus;
  targetPosition: number;
}

/**
 * Filter Options Type
 */
export interface FilterOptions {
  students: Array<{ id: string; name: string }>;
  categories: string[];
}

/**
 * Progress Board Data Type
 */
export interface ProgressBoardData {
  columns: ProgressColumn[];
  filters: FilterOptions;
}

/**
 * Card Move Request Type
 */
export interface CardMoveRequest {
  newStatus: LessonProgressStatus;
  newPosition: number;
  version: string; // ISO timestamp for optimistic locking
}

/**
 * Batch Move Request Type
 */
export interface BatchMoveRequest {
  moves: Array<{
    cardId: string;
    newStatus: LessonProgressStatus;
    newPosition: number;
    version: string;
  }>;
}

/**
 * Card Creation Request Type
 */
export interface CreateCardRequest {
  lessonId: string;
  studentId: string | null;
  status: LessonProgressStatus;
}

/**
 * Card Lock Response Type
 */
export interface CardLockResponse {
  id: string;
  lockedBy: string;
  lockedAt: string;
  expiresAt: string;
}

/**
 * Batch Move Response Type
 */
export interface BatchMoveResponse {
  updatedCards: Array<{
    id: string;
    status: LessonProgressStatus;
    position: number;
    updatedAt: string;
  }>;
  failedMoves: Array<{
    cardId: string;
    error: string;
    code: string;
  }>;
}
