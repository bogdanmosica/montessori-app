import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AttendanceRecord, StudentInfo } from '@/lib/types/attendance';
import { getAttendanceStatusLabel } from '@/lib/constants/attendance-status';
import AttendanceToggle from './AttendanceToggle';
import NotesForm from './NotesForm';

/**
 * Attendance Table (Server Component)
 *
 * Displays student roster with attendance status.
 * Renders interactive client components for toggles and notes.
 */
interface AttendanceTableProps {
  attendanceRecords: AttendanceRecord[];
  studentsWithoutAttendance: StudentInfo[];
  date: string;
}

export default function AttendanceTable({
  attendanceRecords,
  studentsWithoutAttendance,
  date,
}: AttendanceTableProps) {
  // Combine students with and without attendance
  const allStudents = [
    ...attendanceRecords.map((record) => ({
      student: record.student,
      attendance: record,
    })),
    ...studentsWithoutAttendance.map((student) => ({
      student,
      attendance: null,
    })),
  ];

  // Sort by student name
  allStudents.sort((a, b) => {
    const nameA = `${a.student.firstName} ${a.student.lastName}`;
    const nameB = `${b.student.firstName} ${b.student.lastName}`;
    return nameA.localeCompare(nameB);
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student Name</TableHead>
          <TableHead>Date of Birth</TableHead>
          <TableHead>Attendance</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Notes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allStudents.map(({ student, attendance }) => (
          <TableRow key={student.id}>
            <TableCell className="font-medium">
              {student.firstName} {student.lastName}
            </TableCell>
            <TableCell>
              {new Date(student.dateOfBirth).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <AttendanceToggle
                studentId={student.id}
                studentName={`${student.firstName} ${student.lastName}`}
                currentStatus={attendance?.status}
                attendanceId={attendance?.id}
                date={date}
              />
            </TableCell>
            <TableCell>
              {attendance ? (
                <Badge variant={attendance.status.includes('present') ? 'default' : 'secondary'}>
                  {getAttendanceStatusLabel(attendance.status)}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Not recorded</span>
              )}
            </TableCell>
            <TableCell>
              <NotesForm
                studentId={student.id}
                studentName={`${student.firstName} ${student.lastName}`}
                currentNotes={attendance?.notes || null}
                attendanceId={attendance?.id}
                date={date}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
