'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ChildFormSection } from './ChildFormSection';
import { createEnrollmentRequestSchema } from '@/lib/validations/enrollment-validation';
import { ENROLLMENT_STATUS_OPTIONS } from '../constants';
import type { CreateEnrollmentRequest, Child } from '../types';
import { z } from 'zod';
import { FeeInput } from '@/components/ui/fee-input';

interface EnrollmentFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<CreateEnrollmentRequest>;
  enrollmentId?: string;
  onSuccess?: () => void;
}

type FormData = z.infer<typeof createEnrollmentRequestSchema>;

export function EnrollmentForm({
  mode,
  defaultValues,
  enrollmentId,
  onSuccess,
}: EnrollmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [childMode, setChildMode] = useState<'new' | 'existing'>('new');
  const [searchResults, setSearchResults] = useState<Child[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(createEnrollmentRequestSchema),
    defaultValues: {
      enrollment: {
        enrollmentDate: new Date().toISOString().split('T')[0], // Today's date
        notes: '',
        ...defaultValues?.enrollment,
      },
      child: {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        existingChildId: '',
        ...defaultValues?.child,
      },
    },
  });

  // Search for existing children
  const searchChildren = async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/children/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const children = await response.json();
        setSearchResults(children.data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle child selection
  const selectChild = (child: Child) => {
    form.setValue('child.existingChildId', child.id);
    form.setValue('child.firstName', '');
    form.setValue('child.lastName', '');
    form.setValue('child.dateOfBirth', '');
    form.setValue('child.parentName', '');
    form.setValue('child.parentEmail', '');
    form.setValue('child.parentPhone', '');
    setSearchResults([]);
    setSearchTerm(`${child.firstName} ${child.lastName}`);
  };

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const url = mode === 'create'
        ? '/api/enrollments'
        : `/api/enrollments/${enrollmentId}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      // Prepare request data based on child mode
      const requestData = {
        enrollment: data.enrollment,
        child: childMode === 'existing'
          ? { existingChildId: data.child.existingChildId }
          : {
              firstName: data.child.firstName,
              lastName: data.child.lastName,
              dateOfBirth: data.child.dateOfBirth,
              parentName: data.child.parentName,
              parentEmail: data.child.parentEmail || undefined,
              parentPhone: data.child.parentPhone || undefined,
            },
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save enrollment');
      }

      const result = await response.json();

      toast({
        title: mode === 'create' ? 'Enrollment Created' : 'Enrollment Updated',
        description: `${result.data.child.firstName} ${result.data.child.lastName} enrollment has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/enrollments');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} enrollment`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Enrollment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="enrollment.enrollmentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enrollment Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="enrollment.monthlyFeeOverride"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Fee Override (Optional)</FormLabel>
                  <FormControl>
                    <FeeInput
                      id="monthlyFeeOverride"
                      value={field.value ?? null}
                      onChange={field.onChange}
                      placeholder="0.00"
                      helperText="Override the child's default monthly fee for this enrollment. Leave empty to use the child's default fee."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enrollment.notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this enrollment..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes about the enrollment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Child Information */}
        {mode === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Child Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={childMode} onValueChange={(value) => setChildMode(value as 'new' | 'existing')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new">Create New Child</TabsTrigger>
                  <TabsTrigger value="existing">Link Existing Child</TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="space-y-4">
                  <ChildFormSection form={form} />
                </TabsContent>

                <TabsContent value="existing" className="space-y-4">
                  <div className="space-y-4">
                    <FormItem>
                      <FormLabel>Search for Child</FormLabel>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by child name..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            searchChildren(e.target.value);
                          }}
                          className="pl-10"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                        )}
                      </div>
                    </FormItem>

                    {searchResults.length > 0 && (
                      <Card className="border-dashed">
                        <CardContent className="p-4">
                          <Label className="text-sm font-medium">Search Results</Label>
                          <div className="mt-2 space-y-2">
                            {searchResults.map((child) => (
                              <div
                                key={child.id}
                                className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                                onClick={() => selectChild(child)}
                              >
                                <div>
                                  <div className="font-medium">
                                    {child.firstName} {child.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Born: {new Date(child.dateOfBirth).toLocaleDateString()}
                                  </div>
                                </div>
                                <Button type="button" variant="outline" size="sm">
                                  Select
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <FormField
                      control={form.control}
                      name="child.existingChildId"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Create Enrollment' : 'Update Enrollment'}
          </Button>
        </div>
      </form>
    </Form>
  );
}