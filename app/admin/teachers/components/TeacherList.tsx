import { TeacherService } from '@/lib/services/teacher-service';
import { TeacherCard } from './TeacherCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface TeacherListProps {
  schoolId: number;
  page: number;
  limit: number;
  search?: string;
  includeInactive: boolean;
}

export async function TeacherList({
  schoolId,
  page,
  limit,
  search,
  includeInactive,
}: TeacherListProps) {
  try {
    const result = await TeacherService.getTeachers(schoolId, {
      page,
      limit,
      search,
      includeInactive,
      includeStudentDetails: true,
    });

    if (result.teachers.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            {search ? 'No teachers found matching your criteria.' : 'No teachers yet.'}
          </div>
          {!search && (
            <Button asChild>
              <Link href="/admin/teachers/add">
                Add First Teacher
              </Link>
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Teachers Grid */}
        <div className="grid gap-4">
          {result.teachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          Failed to load teachers. Please try again.
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/teachers">Refresh</Link>
        </Button>
      </div>
    );
  }
}

