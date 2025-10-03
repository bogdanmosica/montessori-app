'use client';

/**
 * Draggable Card Component
 *
 * Individual lesson progress card with drag functionality
 */

import { useState } from 'react';
import * as React from 'react';
import { useDrag } from 'react-dnd';
import { ProgressCard } from '@/lib/services/progress-board-service';
import { GripVertical, Trash2, Lock, Edit2, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DraggableCardProps {
  card: ProgressCard;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
}

export function DraggableCard({ card, index, onDelete, onEdit }: DraggableCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PROGRESS_CARD',
    item: { id: card.id, status: card.status, index },
    canDrag: !card.locked_by, // Can't drag if locked
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const isLocked = card.locked_by !== null;

  // Parse student_names if it's a JSON array string, otherwise treat as single student
  const studentNames = React.useMemo(() => {
    if (!card.student_name) return [];

    // Check if it's a JSON array
    if (card.student_name.startsWith('[')) {
      try {
        return JSON.parse(card.student_name);
      } catch {
        return [card.student_name];
      }
    }

    return [card.student_name];
  }, [card.student_name]);

  const hasMultipleStudents = studentNames.length > 1;

  return (
    <div
      ref={drag}
      className={`group relative rounded-lg border bg-white p-3 shadow-sm transition-all ${
        isDragging
          ? 'opacity-50'
          : isLocked
          ? 'cursor-not-allowed opacity-75'
          : 'cursor-move hover:shadow-md'
      }`}
    >
      {/* Drag Handle */}
      <div className="absolute left-1 top-3">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* Lock Indicator */}
      {isLocked && (
        <div className="absolute right-1 top-1">
          <Lock className="h-3 w-3 text-amber-500" />
        </div>
      )}

      <div className="ml-5 mr-1">
        {/* Lesson Title */}
        <h4 className="font-medium text-gray-900 pr-16">{card.lesson_title}</h4>

        {/* Action Buttons - Top Right */}
        <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-7 w-7 hover:bg-blue-100"
            title="Edit assignment"
          >
            <Edit2 className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-7 w-7 hover:bg-red-100"
            title="Delete assignment"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>

        {/* Student Names as Badges */}
        {studentNames.length === 0 ? (
          <p className="mt-1 text-sm text-gray-600">
            <span className="italic text-gray-400">Unassigned</span>
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1">
            {studentNames.map((name: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>
        )}

        {/* Category Badge */}
        <div className="mt-2">
          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            {card.lesson_category}
          </span>
        </div>

        {/* Last Updated */}
        <p className="mt-2 text-xs text-gray-400">
          Updated {new Date(card.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>
  );
}
