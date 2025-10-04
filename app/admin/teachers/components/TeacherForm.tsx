'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTeacherSchema, updateTeacherSchema, type CreateTeacherInput, type UpdateTeacherInput } from '@/lib/validations/teacher-schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface TeacherFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    name: string;
    email: string;
    wage?: number | null;
    nationality?: string | null;
  };
  teacherId?: string;
}

export function TeacherForm({ mode, initialData, teacherId }: TeacherFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = mode === 'create' ? createTeacherSchema : updateTeacherSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTeacherInput | UpdateTeacherInput>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: CreateTeacherInput | UpdateTeacherInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const url = mode === 'create'
        ? '/api/admin/teachers'
        : `/api/admin/teachers/${teacherId}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save teacher');
      }

      // Redirect to teachers list on success
      router.push('/admin/teachers');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Add New Teacher' : 'Edit Teacher'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Create a new teacher account with login credentials.'
            : 'Update teacher information.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="John Doe"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="john.doe@example.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter initial password for teacher"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="wage">Wage (Optional)</Label>
            <Input
              id="wage"
              type="number"
              step="0.01"
              {...register('wage', {
                setValueAs: (v) => v === '' ? undefined : parseFloat(v)
              })}
              placeholder="50000.00"
              disabled={isSubmitting}
            />
            {errors.wage && (
              <p className="text-sm text-destructive">{errors.wage.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality (Optional)</Label>
            <Input
              id="nationality"
              {...register('nationality')}
              placeholder="American"
              disabled={isSubmitting}
            />
            {errors.nationality && (
              <p className="text-sm text-destructive">{errors.nationality.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Create Teacher' : 'Update Teacher'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
