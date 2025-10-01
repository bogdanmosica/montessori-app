import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { SettingsUpdateRequest } from '@/lib/validations/settings-schema';

interface UseSettingsFormProps {
  schoolId: number;
  initialDefaultFee: number;
  initialEnrollmentCount: number;
  initialMaximumCapacity: number;
  initialToddlerCapacity?: number;
  initialPrimaryCapacity?: number;
  initialElementaryCapacity?: number;
}

interface FormErrors {
  defaultFee?: string;
  enrollmentCount?: string;
  maximumCapacity?: string;
  toddlerCapacity?: string;
  primaryCapacity?: string;
  elementaryCapacity?: string;
  general?: string;
}

/**
 * Custom hook for settings form management
 * Handles form state, validation, and submission
 */
export function useSettingsForm({
  schoolId,
  initialDefaultFee,
  initialEnrollmentCount,
  initialMaximumCapacity,
  initialToddlerCapacity = 40,
  initialPrimaryCapacity = 120,
  initialElementaryCapacity = 40,
}: UseSettingsFormProps) {
  const [defaultFee, setDefaultFee] = useState(initialDefaultFee.toString());
  const [enrollmentCount, setEnrollmentCount] = useState(initialEnrollmentCount.toString());
  const [maximumCapacity, setMaximumCapacity] = useState(initialMaximumCapacity.toString());
  const [toddlerCapacity, setToddlerCapacity] = useState(initialToddlerCapacity.toString());
  const [primaryCapacity, setPrimaryCapacity] = useState(initialPrimaryCapacity.toString());
  const [elementaryCapacity, setElementaryCapacity] = useState(initialElementaryCapacity.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();
  const { toast } = useToast();

  /**
   * Validate form inputs
   */
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate default fee
    const feeValue = parseFloat(defaultFee);
    if (isNaN(feeValue)) {
      newErrors.defaultFee = 'Default fee must be a valid number';
    } else if (feeValue < 0) {
      newErrors.defaultFee = 'Default fee cannot be negative';
    } else if (feeValue > 99999.99) {
      newErrors.defaultFee = 'Default fee cannot exceed 99,999.99 RON';
    } else {
      // Check decimal places
      const decimals = defaultFee.split('.')[1];
      if (decimals && decimals.length > 2) {
        newErrors.defaultFee = 'Default fee must have at most 2 decimal places';
      }
    }

    // Validate enrollment count
    const countValue = parseInt(enrollmentCount, 10);
    if (isNaN(countValue)) {
      newErrors.enrollmentCount = 'Enrollment count must be a valid number';
    } else if (!Number.isInteger(countValue)) {
      newErrors.enrollmentCount = 'Enrollment count must be an integer';
    } else if (countValue < 0) {
      newErrors.enrollmentCount = 'Enrollment count cannot be negative';
    } else if (countValue > 9999) {
      newErrors.enrollmentCount = 'Enrollment count cannot exceed 9,999';
    }

    // Validate maximum capacity
    const capacityValue = parseInt(maximumCapacity, 10);
    if (isNaN(capacityValue)) {
      newErrors.maximumCapacity = 'Maximum capacity must be a valid number';
    } else if (!Number.isInteger(capacityValue)) {
      newErrors.maximumCapacity = 'Maximum capacity must be an integer';
    } else if (capacityValue < 1) {
      newErrors.maximumCapacity = 'Maximum capacity must be at least 1';
    } else if (capacityValue > 9999) {
      newErrors.maximumCapacity = 'Maximum capacity cannot exceed 9,999';
    }

    // Validate age group capacities
    const toddlerValue = parseInt(toddlerCapacity, 10);
    if (isNaN(toddlerValue)) {
      newErrors.toddlerCapacity = 'Toddler capacity must be a valid number';
    } else if (toddlerValue < 0) {
      newErrors.toddlerCapacity = 'Toddler capacity cannot be negative';
    } else if (toddlerValue > 999) {
      newErrors.toddlerCapacity = 'Toddler capacity cannot exceed 999';
    }

    const primaryValue = parseInt(primaryCapacity, 10);
    if (isNaN(primaryValue)) {
      newErrors.primaryCapacity = 'Primary capacity must be a valid number';
    } else if (primaryValue < 0) {
      newErrors.primaryCapacity = 'Primary capacity cannot be negative';
    } else if (primaryValue > 999) {
      newErrors.primaryCapacity = 'Primary capacity cannot exceed 999';
    }

    const elementaryValue = parseInt(elementaryCapacity, 10);
    if (isNaN(elementaryValue)) {
      newErrors.elementaryCapacity = 'Elementary capacity must be a valid number';
    } else if (elementaryValue < 0) {
      newErrors.elementaryCapacity = 'Elementary capacity cannot be negative';
    } else if (elementaryValue > 999) {
      newErrors.elementaryCapacity = 'Elementary capacity cannot exceed 999';
    }

    // Validate that age group capacities add up to maximum capacity
    const totalAgeGroupCapacity = toddlerValue + primaryValue + elementaryValue;
    if (!isNaN(capacityValue) && !isNaN(toddlerValue) && !isNaN(primaryValue) && !isNaN(elementaryValue)) {
      if (totalAgeGroupCapacity !== capacityValue) {
        newErrors.maximumCapacity = `Age group capacities (${totalAgeGroupCapacity}) must equal maximum capacity (${capacityValue})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate inputs
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const ageGroupCapacities = [
        {
          ageGroup: 'Toddler (18-36 months)',
          minAge: 18,
          maxAge: 36,
          capacity: parseInt(toddlerCapacity, 10),
        },
        {
          ageGroup: 'Primary (3-6 years)',
          minAge: 37,
          maxAge: 72,
          capacity: parseInt(primaryCapacity, 10),
        },
        {
          ageGroup: 'Elementary (6-12 years)',
          minAge: 73,
          maxAge: 144,
          capacity: parseInt(elementaryCapacity, 10),
        },
      ];

      const requestBody: SettingsUpdateRequest = {
        default_monthly_fee_ron: parseFloat(defaultFee),
        free_enrollment_count: parseInt(enrollmentCount, 10),
        maximum_capacity: parseInt(maximumCapacity, 10),
        age_group_capacities: ageGroupCapacities,
      };

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }

      const data = await response.json();

      // Show success toast
      toast({
        title: 'Settings Updated',
        description: 'School settings have been updated successfully.',
      });

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error updating settings:', error);

      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

      setErrors({
        general: errorMessage,
      });

      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial values
   */
  const handleReset = () => {
    setDefaultFee(initialDefaultFee.toString());
    setEnrollmentCount(initialEnrollmentCount.toString());
    setMaximumCapacity(initialMaximumCapacity.toString());
    setToddlerCapacity(initialToddlerCapacity.toString());
    setPrimaryCapacity(initialPrimaryCapacity.toString());
    setElementaryCapacity(initialElementaryCapacity.toString());
    setErrors({});
  };

  return {
    defaultFee,
    setDefaultFee,
    enrollmentCount,
    setEnrollmentCount,
    maximumCapacity,
    setMaximumCapacity,
    toddlerCapacity,
    setToddlerCapacity,
    primaryCapacity,
    setPrimaryCapacity,
    elementaryCapacity,
    setElementaryCapacity,
    isSubmitting,
    errors,
    handleSubmit,
    handleReset,
  };
}