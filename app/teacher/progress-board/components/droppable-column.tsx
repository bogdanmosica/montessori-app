'use client';

/**
 * Droppable Column Component
 *
 * Column that accepts dragged cards
 */

import { useDrop } from 'react-dnd';
import { ProgressBoardColumn } from '@/lib/services/progress-board-service';
import { DraggableCard } from './draggable-card';

interface DroppableColumnProps {
  column: ProgressBoardColumn;
  onCardMove: (cardId: string, fromStatus: string, toStatus: string, newPosition: number) => void;
  onCardDelete: (cardId: string) => void;
  onCardEdit: (card: any) => void;
}

export function DroppableColumn({ column, onCardMove, onCardDelete, onCardEdit }: DroppableColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'PROGRESS_CARD',
    canDrop: (item: { id: string; status: string }) => {
      // Don't allow dropping on the same status
      return item.status !== column.status_value;
    },
    drop: (item: { id: string; status: string }, monitor) => {
      if (!monitor.didDrop() && item.status !== column.status_value) {
        // Calculate new position (append to end of column)
        const newPosition = column.cards.length;
        
        // Add small delay to prevent rapid successive calls
        setTimeout(() => {
          onCardMove(item.id, item.status, column.status_value, newPosition);
        }, 0);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  }), [column.status_value, column.cards.length, onCardMove]);

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop as any}
      className={`flex flex-col rounded-lg border-2 transition-colors ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : canDrop
          ? 'border-gray-300 bg-gray-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* Column Header */}
      <div
        className="flex items-center gap-2 border-b-2 p-4"
        style={{ borderColor: column.color }}
      >
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="flex-1 font-semibold text-gray-900">{column.name}</h3>
        <span className="text-sm text-gray-500">{column.cards.length}</span>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 p-4">
        {column.cards.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            Drag cards here
          </p>
        ) : (
          column.cards.map((card, index) => (
            <DraggableCard
              key={card.id}
              card={card}
              index={index}
              onDelete={() => onCardDelete(card.id)}
              onEdit={() => onCardEdit(card)}
            />
          ))
        )}
      </div>
    </div>
  );
}
