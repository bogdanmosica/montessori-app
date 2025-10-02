'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Mail, Phone, Trash2, Star, Check } from 'lucide-react';

interface ParentCardProps {
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  relationship: {
    id: string;
    relationshipType: string;
    primaryContact: boolean;
    pickupAuthorized: boolean;
  };
  childId: string;
}

export function ParentCard({ parent, relationship, childId }: ParentCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/children/${childId}/parents/${relationship.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove parent');
      }

      router.refresh();
    } catch (error) {
      console.error('Error removing parent:', error);
      alert(error instanceof Error ? error.message : 'Failed to remove parent');
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Name and Primary Badge */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-lg">
                {parent.firstName} {parent.lastName}
              </h3>
              <p className="text-sm text-muted-foreground capitalize">
                {relationship.relationshipType.toLowerCase()}
              </p>
            </div>
            {relationship.primaryContact && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current" />
                Primary
              </Badge>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{parent.email}</span>
            </div>
            {parent.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{parent.phone}</span>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div className="flex items-center gap-3 text-sm">
            {relationship.pickupAuthorized && (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                <span>Pickup authorized</span>
              </div>
            )}
          </div>

          {/* Remove Button */}
          <div className="pt-2 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Parent
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Parent?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {parent.firstName} {parent.lastName} as a
                    parent? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
