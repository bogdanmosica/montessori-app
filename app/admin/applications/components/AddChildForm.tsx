'use client';

import { useState } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '../../../../components/ui/form';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import {
  CheckCircle,
  Loader2,
  Baby,
  Calendar,
  Users,
  Heart,
  BookOpen,
  AlertTriangle,
  Phone,
} from 'lucide-react';

import { ApplicationWithRelations, ApprovalFormData } from '../../../../lib/types/applications';

// Validation schema for child form
const childFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  programId: z.string().optional(),
  startDate: z.string().optional(),
  medicalInfo: z.object({
    allergies: z.array(z.string()).optional(),
    medications: z.array(z.string()).optional(),
    conditions: z.array(z.string()).optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    notes: z.string().optional(),
  }).optional(),
  notes: z.string().optional(),
});

type ChildFormValues = z.infer<typeof childFormSchema>;

interface AddChildFormProps {
  application: ApplicationWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (childData: ApprovalFormData['childData']) => void;
  isLoading?: boolean;
}

// Mock programs - in real implementation, this would come from the database
const MOCK_PROGRAMS = [
  { id: 'toddler', name: 'Toddler Program (18 months - 3 years)', ageRange: '18m-3y' },
  { id: 'pre-k', name: 'Pre-K Program (3-4 years)', ageRange: '3-4y' },
  { id: 'kindergarten', name: 'Kindergarten Prep (4-5 years)', ageRange: '4-5y' },
  { id: 'after-school', name: 'After School Program (5-12 years)', ageRange: '5-12y' },
];

export function AddChildForm({
  application,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: AddChildFormProps) {
  const [allergiesInput, setAllergiesInput] = useState('');
  const [medicationsInput, setMedicationsInput] = useState('');

  // Helper function to convert Date to YYYY-MM-DD format
  const formatDateForInput = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    
    // Format as YYYY-MM-DD for HTML date input
    return dateObj.toISOString().split('T')[0];
  };

  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childFormSchema),
    defaultValues: {
      name: application.childName,
      dateOfBirth: formatDateForInput(application.childDateOfBirth),
      gender: (application.childGender as 'male' | 'female' | 'other') || undefined,
      programId: '',
      startDate: formatDateForInput(application.preferredStartDate),
      medicalInfo: {
        allergies: [],
        medications: [],
        conditions: [],
        emergencyContact: {
          name: '',
          phone: '',
          relationship: '',
        },
        notes: '',
      },
      notes: application.notes || '',
    },
  });

  // Calculate child's age
  const childAge = Math.floor(
    (new Date().getTime() - new Date(application.childDateOfBirth).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  );

  // Get recommended programs based on age
  const getRecommendedPrograms = (age: number) => {
    if (age < 3) return MOCK_PROGRAMS.filter(p => p.id === 'toddler');
    if (age < 4) return MOCK_PROGRAMS.filter(p => p.id === 'pre-k');
    if (age < 5) return MOCK_PROGRAMS.filter(p => p.id === 'kindergarten');
    return MOCK_PROGRAMS.filter(p => p.id === 'after-school');
  };

  const recommendedPrograms = getRecommendedPrograms(childAge);

  // Handle allergies input
  const handleAllergiesAdd = () => {
    if (allergiesInput.trim()) {
      const currentAllergies = form.getValues('medicalInfo.allergies') || [];
      const newAllergies = allergiesInput.split(',').map(a => a.trim()).filter(a => a);
      form.setValue('medicalInfo.allergies', [...currentAllergies, ...newAllergies]);
      setAllergiesInput('');
    }
  };

  // Handle medications input
  const handleMedicationsAdd = () => {
    if (medicationsInput.trim()) {
      const currentMeds = form.getValues('medicalInfo.medications') || [];
      const newMeds = medicationsInput.split(',').map(m => m.trim()).filter(m => m);
      form.setValue('medicalInfo.medications', [...currentMeds, ...newMeds]);
      setMedicationsInput('');
    }
  };

  // Remove allergy
  const removeAllergy = (index: number) => {
    const allergies = form.getValues('medicalInfo.allergies') || [];
    form.setValue('medicalInfo.allergies', allergies.filter((_, i) => i !== index));
  };

  // Remove medication
  const removeMedication = (index: number) => {
    const medications = form.getValues('medicalInfo.medications') || [];
    form.setValue('medicalInfo.medications', medications.filter((_, i) => i !== index));
  };

  const handleSubmit = (values: ChildFormValues) => {
    const childData: ApprovalFormData['childData'] = {
      name: values.name,
      dateOfBirth: values.dateOfBirth,
      gender: values.gender,
      programId: values.programId,
      startDate: values.startDate,
    };

    onSubmit(childData);
  };

  const handleClose = () => {
    form.reset();
    setAllergiesInput('');
    setMedicationsInput('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Create Child Record
          </DialogTitle>
          <DialogDescription>
            Set up the child record for {application.childName} to complete the application approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Child Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Child Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Age:</span> {childAge} years old
                  </div>
                  <div>
                    <span className="font-medium">Requested Program:</span> {application.programRequested}
                  </div>
                  <div>
                    <span className="font-medium">Preferred Start:</span>{' '}
                    {application.preferredStartDate
                      ? new Intl.DateTimeFormat('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }).format(new Date(application.preferredStartDate))
                      : 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Parent:</span> {application.parentName}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Baby className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Child's full name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                            <Input {...field} type="date" className="pl-8" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Program Assignment */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Program Assignment
                </CardTitle>
                <CardDescription>
                  Based on {application.childName}'s age ({childAge} years), the following programs are recommended.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Program</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MOCK_PROGRAMS.map((program) => (
                            <SelectItem key={program.id} value={program.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{program.name}</span>
                                {recommendedPrograms.find(p => p.id === program.id) && (
                                  <Badge variant="secondary" className="ml-2">
                                    Recommended
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The child will be enrolled in the selected program upon approval.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                          <Input {...field} type="date" className="pl-8" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        When should the child start in the program?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Medical Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Medical Information
                </CardTitle>
                <CardDescription>
                  Important medical information for the child's safety and care.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Allergies */}
                <div>
                  <FormLabel className="text-sm font-medium">Allergies</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={allergiesInput}
                      onChange={(e) => setAllergiesInput(e.target.value)}
                      placeholder="Add allergies (comma-separated)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAllergiesAdd();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleAllergiesAdd} size="sm">
                      Add
                    </Button>
                  </div>
                  {(form.watch('medicalInfo.allergies') || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.watch('medicalInfo.allergies') || []).map((allergy, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeAllergy(index)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medications */}
                <div>
                  <FormLabel className="text-sm font-medium">Medications</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={medicationsInput}
                      onChange={(e) => setMedicationsInput(e.target.value)}
                      placeholder="Add medications (comma-separated)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleMedicationsAdd();
                        }
                      }}
                    />
                    <Button type="button" onClick={handleMedicationsAdd} size="sm">
                      Add
                    </Button>
                  </div>
                  {(form.watch('medicalInfo.medications') || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.watch('medicalInfo.medications') || []).map((medication, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {medication}
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="ml-1 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emergency Contact for Child */}
                <div>
                  <FormLabel className="text-sm font-medium">Emergency Contact (Child-Specific)</FormLabel>
                  <FormDescription className="text-xs text-gray-600 mt-1">
                    Alternative emergency contact for this child (if different from parent's emergency contact)
                  </FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <FormField
                      control={form.control}
                      name="medicalInfo.emergencyContact.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Contact name" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalInfo.emergencyContact.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                              <Input {...field} className="pl-8" placeholder="Phone number" />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="medicalInfo.emergencyContact.relationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="Relationship" />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Medical Notes */}
                <FormField
                  control={form.control}
                  name="medicalInfo.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional medical information, special needs, or instructions for staff..."
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Include any important medical conditions, dietary restrictions, or care instructions.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional notes about the child, special considerations, or important information..."
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Include behavioral notes, preferences, or any other relevant information.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Record...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Create Child Record
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