'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RotateCcw } from 'lucide-react';
import { useSettingsForm } from './use-settings-form';

interface SettingsFormProps {
  schoolId: number;
  initialDefaultFee: number;
  initialEnrollmentCount: number;
  initialMaximumCapacity: number;
  initialToddlerCapacity?: number;
  initialPrimaryCapacity?: number;
  initialElementaryCapacity?: number;
}

/**
 * Settings Form Component - Client Component
 * Form for updating school settings
 */
export function SettingsForm({
  schoolId,
  initialDefaultFee,
  initialEnrollmentCount,
  initialMaximumCapacity,
  initialToddlerCapacity,
  initialPrimaryCapacity,
  initialElementaryCapacity,
}: SettingsFormProps) {
  const {
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
  } = useSettingsForm({
    schoolId,
    initialDefaultFee,
    initialEnrollmentCount,
    initialMaximumCapacity,
    initialToddlerCapacity,
    initialPrimaryCapacity,
    initialElementaryCapacity,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General error message */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Default Monthly Fee */}
      <div className="space-y-2">
        <Label htmlFor="defaultFee">
          Default Monthly Fee (RON)
        </Label>
        <Input
          id="defaultFee"
          type="number"
          step="0.01"
          min="0"
          max="99999.99"
          value={defaultFee}
          onChange={(e) => setDefaultFee(e.target.value)}
          disabled={isSubmitting}
          placeholder="0.00"
          className={errors.defaultFee ? 'border-destructive' : ''}
          aria-invalid={!!errors.defaultFee}
          aria-describedby={errors.defaultFee ? 'defaultFee-error' : undefined}
        />
        {errors.defaultFee && (
          <p id="defaultFee-error" className="text-sm text-destructive">
            {errors.defaultFee}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          This fee will be automatically applied to new child enrollments.
        </p>
      </div>

      {/* Free Enrollment Count */}
      <div className="space-y-2">
        <Label htmlFor="enrollmentCount">
          Free Enrollment Quota
        </Label>
        <Input
          id="enrollmentCount"
          type="number"
          step="1"
          min="0"
          max="9999"
          value={enrollmentCount}
          onChange={(e) => setEnrollmentCount(e.target.value)}
          disabled={isSubmitting}
          placeholder="0"
          className={errors.enrollmentCount ? 'border-destructive' : ''}
          aria-invalid={!!errors.enrollmentCount}
          aria-describedby={errors.enrollmentCount ? 'enrollmentCount-error' : undefined}
        />
        {errors.enrollmentCount && (
          <p id="enrollmentCount-error" className="text-sm text-destructive">
            {errors.enrollmentCount}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Number of free enrollments available school-wide.
        </p>
      </div>

      {/* Maximum Capacity */}
      <div className="space-y-2">
        <Label htmlFor="maximumCapacity">
          Maximum Capacity
        </Label>
        <Input
          id="maximumCapacity"
          type="number"
          step="1"
          min="1"
          max="9999"
          value={maximumCapacity}
          onChange={(e) => setMaximumCapacity(e.target.value)}
          disabled={isSubmitting}
          placeholder="100"
          className={errors.maximumCapacity ? 'border-destructive' : ''}
          aria-invalid={!!errors.maximumCapacity}
          aria-describedby={errors.maximumCapacity ? 'maximumCapacity-error' : undefined}
        />
        {errors.maximumCapacity && (
          <p id="maximumCapacity-error" className="text-sm text-destructive">
            {errors.maximumCapacity}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Total student capacity for the school.
        </p>
      </div>

      {/* Age Group Capacities */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Age Group Capacities</Label>
          <p className="text-sm text-muted-foreground">
            Set specific capacity limits for each age group. Total should equal maximum capacity.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Toddler Capacity */}
          <div className="space-y-2">
            <Label htmlFor="toddlerCapacity">
              Toddler (18-36 months)
            </Label>
            <Input
              id="toddlerCapacity"
              type="number"
              step="1"
              min="0"
              max="999"
              value={toddlerCapacity}
              onChange={(e) => setToddlerCapacity(e.target.value)}
              disabled={isSubmitting}
              placeholder="40"
              className={errors.toddlerCapacity ? 'border-destructive' : ''}
              aria-invalid={!!errors.toddlerCapacity}
              aria-describedby={errors.toddlerCapacity ? 'toddlerCapacity-error' : undefined}
            />
            {errors.toddlerCapacity && (
              <p id="toddlerCapacity-error" className="text-sm text-destructive">
                {errors.toddlerCapacity}
              </p>
            )}
          </div>

          {/* Primary Capacity */}
          <div className="space-y-2">
            <Label htmlFor="primaryCapacity">
              Primary (3-6 years)
            </Label>
            <Input
              id="primaryCapacity"
              type="number"
              step="1"
              min="0"
              max="999"
              value={primaryCapacity}
              onChange={(e) => setPrimaryCapacity(e.target.value)}
              disabled={isSubmitting}
              placeholder="120"
              className={errors.primaryCapacity ? 'border-destructive' : ''}
              aria-invalid={!!errors.primaryCapacity}
              aria-describedby={errors.primaryCapacity ? 'primaryCapacity-error' : undefined}
            />
            {errors.primaryCapacity && (
              <p id="primaryCapacity-error" className="text-sm text-destructive">
                {errors.primaryCapacity}
              </p>
            )}
          </div>

          {/* Elementary Capacity */}
          <div className="space-y-2">
            <Label htmlFor="elementaryCapacity">
              Elementary (6-12 years)
            </Label>
            <Input
              id="elementaryCapacity"
              type="number"
              step="1"
              min="0"
              max="999"
              value={elementaryCapacity}
              onChange={(e) => setElementaryCapacity(e.target.value)}
              disabled={isSubmitting}
              placeholder="40"
              className={errors.elementaryCapacity ? 'border-destructive' : ''}
              aria-invalid={!!errors.elementaryCapacity}
              aria-describedby={errors.elementaryCapacity ? 'elementaryCapacity-error' : undefined}
            />
            {errors.elementaryCapacity && (
              <p id="elementaryCapacity-error" className="text-sm text-destructive">
                {errors.elementaryCapacity}
              </p>
            )}
          </div>
        </div>

        {/* Capacity Total Display */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-blue-900">Age Group Total:</span>
            <span className={`font-medium ${
              (parseInt(toddlerCapacity) || 0) + (parseInt(primaryCapacity) || 0) + (parseInt(elementaryCapacity) || 0) !== (parseInt(maximumCapacity) || 0)
                ? 'text-red-600'
                : 'text-blue-900'
            }`}>
              {(parseInt(toddlerCapacity) || 0) + (parseInt(primaryCapacity) || 0) + (parseInt(elementaryCapacity) || 0)} / {parseInt(maximumCapacity) || 0}
            </span>
          </div>
          {(parseInt(toddlerCapacity) || 0) + (parseInt(primaryCapacity) || 0) + (parseInt(elementaryCapacity) || 0) !== (parseInt(maximumCapacity) || 0) && (
            <p className="text-xs text-red-600 mt-1">
              Age group capacities should add up to the maximum capacity.
            </p>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>
    </form>
  );
}