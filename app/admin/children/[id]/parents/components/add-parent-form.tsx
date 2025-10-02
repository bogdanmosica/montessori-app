'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface AddParentFormProps {
  childId: string;
  schoolId: number;
  hasExistingParents: boolean;
}

export function AddParentForm({ childId, schoolId, hasExistingParents }: AddParentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationshipType: 'MOTHER' as 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER',
    primaryContact: !hasExistingParents, // First parent is primary by default
    pickupAuthorized: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/children/${childId}/parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add parent');
      }

      // Refresh the page to show the new parent
      router.refresh();

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        relationshipType: 'MOTHER',
        primaryContact: false,
        pickupAuthorized: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Last Name */}
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={isSubmitting}
          />
        </div>

        {/* Relationship Type */}
        <div className="space-y-2">
          <Label htmlFor="relationshipType">Relationship *</Label>
          <Select
            value={formData.relationshipType}
            onValueChange={(value: any) => setFormData({ ...formData, relationshipType: value })}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MOTHER">Mother</SelectItem>
              <SelectItem value="FATHER">Father</SelectItem>
              <SelectItem value="GUARDIAN">Guardian</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="primaryContact"
            checked={formData.primaryContact}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, primaryContact: checked as boolean })
            }
            disabled={isSubmitting || (!hasExistingParents)} // First parent must be primary
          />
          <Label
            htmlFor="primaryContact"
            className="text-sm font-normal cursor-pointer"
          >
            Primary contact {!hasExistingParents && '(required for first parent)'}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="pickupAuthorized"
            checked={formData.pickupAuthorized}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, pickupAuthorized: checked as boolean })
            }
            disabled={isSubmitting}
          />
          <Label
            htmlFor="pickupAuthorized"
            className="text-sm font-normal cursor-pointer"
          >
            Authorized for pickup
          </Label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Parent
        </Button>
      </div>
    </form>
  );
}
