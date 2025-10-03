'use client';

/**
 * Progress Board Client Component
 *
 * Main client component with drag-and-drop functionality
 */

import { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ProgressBoardColumn, ProgressCard } from '@/lib/services/progress-board-service';
import { DroppableColumn } from './droppable-column';
import { FilterControls } from './filter-controls';
import { CreateAssignmentModal } from './create-assignment-modal';
import { EditAssignmentModal } from './edit-assignment-modal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProgressBoardClientProps {
  initialColumns: ProgressBoardColumn[];
  filterOptions: {
    students: Array<{ id: string; name: string }>;
    categories: string[];
  };
  teacherId: number;
  schoolId: number;
}

export function ProgressBoardClient({
  initialColumns,
  filterOptions,
  teacherId,
  schoolId,
}: ProgressBoardClientProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [filters, setFilters] = useState<{
    student_id?: string;
    category?: string;
  }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<ProgressCard | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [movingCards, setMovingCards] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Debug logging
  console.log('Modal state:', isCreateModalOpen);
  console.log('Columns loaded:', columns.map(c => ({ name: c.name, status: c.status_value, cardCount: c.cards.length })));

  // Handle card move with improved race condition protection
  const handleCardMove = useCallback(
    async (cardId: string, fromStatus: string, toStatus: string, newPosition: number) => {
      // Prevent concurrent moves on the same card
      if (movingCards.has(cardId)) {
        console.log(`Move already in progress for card ${cardId}, ignoring`);
        return;
      }

      // Prevent moving to the same status
      if (fromStatus === toStatus) {
        console.log('Same status move, ignoring');
        return;
      }

      // Add card to moving set
      setMovingCards(prev => new Set(prev).add(cardId));
      setIsMoving(true);

      // Save previous state for potential rollback
      const previousColumns = columns;

      // Find the card being moved
      const movedCard = columns
        .find((c) => c.status_value === fromStatus)
        ?.cards.find((card) => card.id === cardId);

      if (!movedCard) {
        console.error('Card not found:', cardId);
        setIsMoving(false);
        return;
      }

      // Optimistically update UI
      const updatedColumns = columns.map((col) => {
        if (col.status_value === fromStatus) {
          return {
            ...col,
            cards: col.cards.filter((card) => card.id !== cardId).map((card, idx) => ({
              ...card,
              position: idx,
            })),
          };
        }
        if (col.status_value === toStatus) {
          const newCards = [...col.cards];
          newCards.splice(newPosition, 0, {
            ...movedCard,
            status: toStatus,
            position: newPosition,
          });
          return {
            ...col,
            cards: newCards.map((card, idx) => ({
              ...card,
              position: idx,
            })),
          };
        }
        return col;
      });

      setColumns(updatedColumns);

      // Make API call with timeout and better error handling
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`/api/teacher/progress-board/cards/${cardId}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_status: toStatus,
            new_position: newPosition,
            version: new Date().toISOString(), // Use current timestamp instead of card version
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          // Revert on error
          setColumns(previousColumns);
          let errorMessage = 'Failed to move card';
          
          try {
            const error = await response.json();
            errorMessage = error.error?.message || errorMessage;
          } catch (e) {
            console.warn('Could not parse error response:', e);
          }
          
          console.error('Move failed:', errorMessage);
          // Use toast instead of alert for better UX
          // alert(errorMessage);
        } else {
          // Update with server response
          const data = await response.json();
          if (data.success) {
            console.log('Card moved successfully:', data.data);
            // Optionally refresh with server data to ensure consistency
            if (data.data) {
              // Update the specific card with server data if provided
            }
          }
        }
      } catch (error) {
        // Handle timeout and other errors
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Move request timed out');
        } else {
          console.error('Error moving card:', error);
        }
        
        // Revert on error
        setColumns(previousColumns);
      } finally {
        // Always clean up
        setMovingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
        setIsMoving(false);
      }
    },
    [columns, movingCards]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    async (newFilters: { student_id?: string; category?: string }) => {
      setFilters(newFilters);

      // Fetch filtered data
      const params = new URLSearchParams();
      if (newFilters.student_id) params.append('student_id', newFilters.student_id);
      if (newFilters.category) params.append('category', newFilters.category);

      try {
        const response = await fetch(`/api/teacher/progress-board?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setColumns(data.data.columns);
        }
      } catch (error) {
        console.error('Error fetching filtered data:', error);
      }
    },
    []
  );

  // Handle card deletion - open confirmation dialog
  const handleCardDelete = useCallback((cardId: string) => {
    setCardToDelete(cardId);
    setDeleteDialogOpen(true);
  }, []);

  // Confirm card deletion
  const confirmDelete = useCallback(async () => {
    if (!cardToDelete) return;

    try {
      const response = await fetch(`/api/teacher/progress-board/cards/${cardToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove card from UI
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            cards: col.cards.filter((card) => card.id !== cardToDelete),
          }))
        );
      } else {
        const error = await response.json();
        console.error('Failed to delete card:', error.error?.message);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    } finally {
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  }, [cardToDelete]);

  // Handle card creation
  const handleCardCreate = useCallback(
    (newCard: any) => {
      // Refresh the board data
      fetch('/api/teacher/progress-board')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setColumns(data.data.columns);
          }
        })
        .catch(console.error);
    },
    []
  );

  // Handle card edit
  const handleCardEdit = useCallback((card: ProgressCard) => {
    setSelectedCard(card);
    setIsEditModalOpen(true);
  }, []);

  // Handle edit success
  const handleEditSuccess = useCallback(() => {
    // Refresh the board data
    fetch('/api/teacher/progress-board')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setColumns(data.data.columns);
        }
      })
      .catch(console.error);
  }, []);

  const hasCards = columns.some((col) => col.cards.length > 0);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        {/* Header with filters and create button */}
        <div className="flex items-center justify-between gap-4">
          <FilterControls
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={handleFilterChange}
          />
          <Button onClick={() => {
            console.log('New Assignment clicked');
            setIsCreateModalOpen(true);
          }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </div>

        {/* Progress Board Columns */}
        {hasCards ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                onCardMove={handleCardMove}
                onCardDelete={handleCardDelete}
                onCardEdit={handleCardEdit}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">No lesson assignments yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first lesson assignment
            </p>
            <Button onClick={() => {
              console.log('Create First Assignment clicked');
              setIsCreateModalOpen(true);
            }} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Create First Assignment
            </Button>
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCardCreate}
        schoolId={schoolId}
        teacherId={teacherId}
        filterOptions={filterOptions}
      />

      {/* Edit Assignment Modal */}
      <EditAssignmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        card={selectedCard}
        filterOptions={filterOptions}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCardToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndProvider>
  );
}
