'use client';

import { useState } from 'react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/ui/form';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import { Checkbox } from '../../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  XCircle,
  AlertTriangle,
  Mail,
  FileText,
  Loader2,
} from 'lucide-react';

import { ApplicationWithRelations, RejectionFormData } from '../../../../lib/types/applications';

// Validation schema for rejection form
const rejectionFormSchema = z.object({
  rejectionReason: z.string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must be less than 500 characters'),
  notifyParent: z.boolean().default(true),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  reasonCategory: z.enum([
    'age_requirements',
    'program_capacity',
    'incomplete_information',
    'eligibility_requirements',
    'timing_constraints',
    'other'
  ]).default('other'),
});

type RejectionFormValues = z.infer<typeof rejectionFormSchema>;

interface RejectionModalProps {
  application: ApplicationWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RejectionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function RejectionModal({
  application,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: RejectionModalProps) {
  const [step, setStep] = useState<'reason' | 'review'>('reason');

  const form = useForm({
    resolver: zodResolver(rejectionFormSchema),
    defaultValues: {
      rejectionReason: '',
      notifyParent: true,
      notes: '',
      reasonCategory: 'other',
    },
  });

  // Handle form submission
  const handleSubmit = async (data: RejectionFormValues) => {
    if (step === 'reason') {
      setStep('review');
      return;
    }

    try {
      await onSubmit({
        rejectionReason: data.rejectionReason,
        notifyParent: data.notifyParent,
        notes: data.notes,
      });

      // Reset form and step on successful submission
      form.reset();
      setStep('reason');
      onClose();
    } catch (error) {
      console.error('Error submitting rejection:', error);
      // Form will display error from parent component
    }
  };

  // Handle modal close
  const handleClose = () => {
    form.reset();
    setStep('reason');
    onClose();
  };

  // Handle back to edit
  const handleBack = () => {
    setStep('reason');
  };

  // Get reason templates based on category
  const getReasonTemplate = (category: string): string => {
    const templates = {
      age_requirements: `Unfortunately, ${application.childName} does not meet the age requirements for the ${application.programRequested} program at this time. We recommend reapplying when they meet the minimum age requirement.`,
      program_capacity: `We regret to inform you that the ${application.programRequested} program has reached full capacity for the upcoming term. We encourage you to apply for future terms or consider our waitlist option.`,
      incomplete_information: `Your application for ${application.childName} is missing required documentation or information. Please provide all necessary materials and resubmit your application.`,
      eligibility_requirements: `After careful review, ${application.childName} does not meet the eligibility requirements for the ${application.programRequested} program at this time.`,
      timing_constraints: `Unfortunately, we cannot accommodate the requested start date for ${application.childName} in the ${application.programRequested} program. Please consider alternative start dates.`,
      other: '',
    };
    return templates[category as keyof typeof templates] || '';
  };

  // Watch for category changes to update reason template
  const reasonCategory = form.watch('reasonCategory');
  const currentReason = form.watch('rejectionReason');

  // Update reason template when category changes
  React.useEffect(() => {
    if (reasonCategory) {
      const template = getReasonTemplate(reasonCategory);
      if (template && !currentReason) {
        form.setValue('rejectionReason', template);
      }
    }
  }, [reasonCategory, currentReason, form]);

  const formData = form.watch();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            {step === 'reason' ? 'Reject Application' : 'Review Rejection'}
          </DialogTitle>
          <DialogDescription>
            {step === 'reason'
              ? `Provide a reason for rejecting ${application.childName}'s application`
              : 'Please review the rejection details before confirming'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {step === 'reason' ? (
              <>
                {/* Application Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Application Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Parent:</span> {application.parentName}
                    </div>
                    <div>
                      <span className="text-gray-500">Child:</span> {application.childName}
                    </div>
                    <div>
                      <span className="text-gray-500">Program:</span> {application.programRequested}
                    </div>
                    <div>
                      <span className="text-gray-500">Applied:</span>{' '}
                      {new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }).format(application.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Reason Category */}
                <FormField
                  control={form.control}
                  name="reasonCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejection Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="age_requirements">Age Requirements</SelectItem>
                          <SelectItem value="program_capacity">Program Capacity</SelectItem>
                          <SelectItem value="incomplete_information">Incomplete Information</SelectItem>
                          <SelectItem value="eligibility_requirements">Eligibility Requirements</SelectItem>
                          <SelectItem value="timing_constraints">Timing Constraints</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the primary reason for rejection to use a template
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rejection Reason */}
                <FormField
                  control={form.control}
                  name="rejectionReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejection Reason *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please provide a clear and professional reason for rejecting this application..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This reason will be shared with the parent if notifications are enabled
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Internal Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any internal notes for future reference..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        These notes are for internal use only and will not be shared with the parent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Notify Parent */}
                <FormField
                  control={form.control}
                  name="notifyParent"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Send rejection notification to parent
                        </FormLabel>
                        <FormDescription>
                          An email will be sent to {application.parentEmail} with the rejection reason
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                {/* Review Step */}
                <div className="space-y-4">
                  {/* Warning */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">Confirm Rejection</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          This action cannot be undone. The application will be marked as rejected
                          and the parent will be notified if enabled.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Review Details */}
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4" />
                        Rejection Reason
                      </h5>
                      <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                        {formData.rejectionReason}
                      </p>
                    </div>

                    {formData.notes && (
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium flex items-center gap-2 mb-3">
                          <FileText className="h-4 w-4" />
                          Internal Notes
                        </h5>
                        <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {formData.notes}
                        </p>
                      </div>
                    )}

                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium flex items-center gap-2 mb-3">
                        <Mail className="h-4 w-4" />
                        Notification Settings
                      </h5>
                      <p className="text-gray-700">
                        {formData.notifyParent ? (
                          <>
                            ✅ Parent will be notified via email at{' '}
                            <span className="font-mono text-sm bg-gray-100 px-1 rounded">
                              {application.parentEmail}
                            </span>
                          </>
                        ) : (
                          '❌ Parent will NOT be notified'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <DialogFooter className="flex items-center justify-between">
              <div className="flex gap-2">
                {step === 'review' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Back to Edit
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>

              <Button
                type="submit"
                variant={step === 'review' ? 'destructive' : 'default'}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : step === 'reason' ? (
                  'Review Rejection'
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}