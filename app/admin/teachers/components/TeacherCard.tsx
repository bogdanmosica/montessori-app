'use client';

import { useState } from 'react';
import { TeacherStatusBadge } from './TeacherStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { User, Mail, Users, Edit, ChevronDown, ChevronUp, BookOpen, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export interface TeacherCardProps {
  teacher: {
    id: string;
    user: {
      id: number;
      name: string;
      email: string;
    };
    wage: string | null;
    nationality: string | null;
    isActive: boolean;
    studentCount: number;
    createdAt: string;
    updatedAt: string;
    students: Array<{ id: string; firstName: string; lastName: string }>;
    lessonStats: { opened: number; completed: number };
  };
}

export function TeacherCard({ teacher }: TeacherCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={!teacher.isActive ? 'opacity-60 border-gray-300' : ''}>
        <CollapsibleTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 cursor-pointer hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-lg">{teacher.user.name}</div>
                  <TeacherStatusBadge isActive={teacher.isActive} />
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-3 w-3 mr-1" />
                  {teacher.user.email}
                </div>

                {/* Quick Info - Student Badges */}
                {teacher.students.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {teacher.students.slice(0, 3).map((student) => (
                      <Badge key={student.id} variant="secondary" className="text-xs">
                        {student.firstName} {student.lastName}
                      </Badge>
                    ))}
                    {teacher.students.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{teacher.students.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); }} asChild>
                <Link href={`/admin/teachers/${teacher.id}`}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <div className="text-muted-foreground mb-1">Students</div>
                <div className="flex items-center font-medium">
                  <Users className="h-4 w-4 mr-1 text-blue-500" />
                  {teacher.studentCount}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Lessons Opened</div>
                <div className="flex items-center font-medium">
                  <BookOpen className="h-4 w-4 mr-1 text-amber-500" />
                  {teacher.lessonStats.opened}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Lessons Completed</div>
                <div className="flex items-center font-medium">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                  {teacher.lessonStats.completed}
                </div>
              </div>
              {teacher.wage && (
                <div>
                  <div className="text-muted-foreground mb-1">Wage</div>
                  <div className="font-medium">${parseFloat(teacher.wage).toFixed(2)}</div>
                </div>
              )}
              {teacher.nationality && (
                <div>
                  <div className="text-muted-foreground mb-1">Nationality</div>
                  <div className="font-medium">{teacher.nationality}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground mb-1">Member Since</div>
                <div className="font-medium">
                  {new Date(teacher.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* All Students List */}
            {teacher.students.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Assigned Students ({teacher.students.length})</h4>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.students.map((student) => (
                    <Badge key={student.id} variant="secondary">
                      {student.firstName} {student.lastName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
