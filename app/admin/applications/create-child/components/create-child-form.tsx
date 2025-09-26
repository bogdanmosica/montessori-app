'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CreateChildFormProps {
  adminUserId: number;
  schoolId: number;
}

interface ParentData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  relationship_type: 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER';
  primary_contact?: boolean;
  pickup_authorized?: boolean;
}

interface ChildData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: string;
  start_date: string;
  special_needs?: string;
  medical_conditions?: string;
}

export function CreateChildForm({ adminUserId, schoolId }: CreateChildFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDateOfBirthOpen, setIsDateOfBirthOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);

  // Form state
  const [childData, setChildData] = useState<ChildData>({
    first_name: '',
    last_name: '',
    date_of_birth: '2021-05-15', // Default to a valid date for testing
    gender: '',
    start_date: '2025-10-01', // Default to a future date
    special_needs: '',
    medical_conditions: '',
  });

  const [parents, setParents] = useState<ParentData[]>([
    {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      relationship_type: 'MOTHER',
      primary_contact: true,
      pickup_authorized: true,
    },
  ]);

  const handleChildDataChange = (field: keyof ChildData, value: string) => {
    setChildData(prev => ({ ...prev, [field]: value }));
  };

  const handleParentChange = (index: number, field: keyof ParentData, value: string | boolean) => {
    setParents(prev => prev.map((parent, i) => 
      i === index ? { ...parent, [field]: value } : parent
    ));
  };

  const addParent = () => {
    if (parents.length < 2) {
      setParents(prev => [...prev, {
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        relationship_type: 'FATHER',
        primary_contact: false,
        pickup_authorized: true,
      }]);
    }
  };

  const removeParent = (index: number) => {
    if (parents.length > 1) {
      setParents(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!childData.first_name || !childData.last_name || !childData.date_of_birth || !childData.start_date) {
        throw new Error('Please fill in all required child information fields');
      }

      // Validate at least one parent
      const validParents = parents.filter(p => p.first_name && p.last_name && p.email);
      if (validParents.length === 0) {
        throw new Error('Please provide information for at least one parent');
      }

      // Submit to API
      const response = await fetch('/api/admin/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          child: childData,
          parents: validParents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create child profile');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: `Child profile created successfully for ${childData.first_name} ${childData.last_name}`,
      });

      // Redirect back to applications list
      router.push('/admin/applications');
      router.refresh();

    } catch (error) {
      console.error('Error creating child profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create child profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Child Information */}
      <Card>
        <CardHeader>
          <CardTitle>Child Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="child-first-name">First Name *</Label>
              <Input
                id="child-first-name"
                value={childData.first_name}
                onChange={(e) => handleChildDataChange('first_name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-last-name">Last Name *</Label>
              <Input
                id="child-last-name"
                value={childData.last_name}
                onChange={(e) => handleChildDataChange('last_name', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Birth *</Label>
              <Popover open={isDateOfBirthOpen} onOpenChange={setIsDateOfBirthOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !childData.date_of_birth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {childData.date_of_birth ? (
                      format(new Date(childData.date_of_birth), 'PPP')
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={childData.date_of_birth ? new Date(childData.date_of_birth) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleChildDataChange('date_of_birth', date.toISOString().split('T')[0]);
                        setIsDateOfBirthOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-gender">Gender</Label>
              <Select onValueChange={(value) => handleChildDataChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !childData.start_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {childData.start_date ? (
                    format(new Date(childData.start_date), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={childData.start_date ? new Date(childData.start_date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      handleChildDataChange('start_date', date.toISOString().split('T')[0]);
                      setIsStartDateOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="special-needs">Special Needs</Label>
            <Textarea
              id="special-needs"
              placeholder="Describe any special needs or accommodations..."
              value={childData.special_needs}
              onChange={(e) => handleChildDataChange('special_needs', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical-conditions">Medical Conditions</Label>
            <Textarea
              id="medical-conditions"
              placeholder="List any medical conditions, allergies, or medications..."
              value={childData.medical_conditions}
              onChange={(e) => handleChildDataChange('medical_conditions', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Parent Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Parent Information</CardTitle>
            {parents.length < 2 && (
              <Button type="button" variant="outline" size="sm" onClick={addParent}>
                <Plus className="h-4 w-4 mr-2" />
                Add Parent
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {parents.map((parent, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {index === 0 ? 'Primary Parent' : 'Secondary Parent'}
                </Badge>
                {parents.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeParent(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`parent-${index}-first-name`}>First Name *</Label>
                  <Input
                    id={`parent-${index}-first-name`}
                    value={parent.first_name}
                    onChange={(e) => handleParentChange(index, 'first_name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`parent-${index}-last-name`}>Last Name *</Label>
                  <Input
                    id={`parent-${index}-last-name`}
                    value={parent.last_name}
                    onChange={(e) => handleParentChange(index, 'last_name', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`parent-${index}-email`}>Email *</Label>
                  <Input
                    id={`parent-${index}-email`}
                    type="email"
                    value={parent.email}
                    onChange={(e) => handleParentChange(index, 'email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`parent-${index}-phone`}>Phone</Label>
                  <Input
                    id={`parent-${index}-phone`}
                    type="tel"
                    value={parent.phone}
                    onChange={(e) => handleParentChange(index, 'phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`parent-${index}-relationship`}>Relationship</Label>
                <Select 
                  onValueChange={(value) => handleParentChange(index, 'relationship_type', value as 'MOTHER' | 'FATHER' | 'GUARDIAN' | 'OTHER')}
                  defaultValue={parent.relationship_type}
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
          ))}
        </CardContent>
      </Card>

      {/* Submit Actions */}
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => router.push('/admin/applications')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Child Profile'}
        </Button>
      </div>
    </form>
  );
}