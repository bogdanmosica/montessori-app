'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserRole, USER_ROLE_LABELS } from '@/lib/constants/user-roles';
import { Shield, Users, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface RoleAssignmentProps {
  user: User;
  onRoleUpdated: (user: User) => void;
}

const roleIcons = {
  [UserRole.PARENT]: Users,
  [UserRole.TEACHER]: GraduationCap,
  [UserRole.ADMIN]: Shield,
  [UserRole.SUPER_ADMIN]: Shield,
};

export function RoleAssignment({ user, onRoleUpdated }: RoleAssignmentProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleAssignment = async () => {
    if (selectedRole === user.role) {
      toast.error('Please select a different role to assign');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the role change');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/assign-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newRole: selectedRole,
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to assign role');
      }

      // Update user with new role information
      const updatedUser = {
        ...user,
        role: selectedRole,
      };

      onRoleUpdated(updatedUser);
      setReason('');

      toast.success(`Role successfully changed from ${USER_ROLE_LABELS[user.role]} to ${USER_ROLE_LABELS[selectedRole]}`);

    } catch (error) {
      console.error('Role assignment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'text-red-600 bg-red-50';
      case UserRole.SUPER_ADMIN:
        return 'text-purple-600 bg-purple-50';
      case UserRole.TEACHER:
        return 'text-blue-600 bg-blue-50';
      case UserRole.PARENT:
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const CurrentRoleIcon = roleIcons[user.role];
  const NewRoleIcon = roleIcons[selectedRole];

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CurrentRoleIcon className="h-5 w-5" />
          Assign Role to {user.name}
        </CardTitle>
        <p className="text-sm text-gray-600">{user.email}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Current Role</Label>
          <div className={`mt-1 px-3 py-2 rounded-md text-sm font-medium ${getRoleVariant(user.role)}`}>
            <div className="flex items-center gap-2">
              <CurrentRoleIcon className="h-4 w-4" />
              {USER_ROLE_LABELS[user.role]}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="role-select" className="text-sm font-medium">
            New Role
          </Label>
          <Select
            value={selectedRole}
            onValueChange={(value) => setSelectedRole(value as UserRole)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="role-select" className="mt-1">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <NewRoleIcon className="h-4 w-4" />
                  {USER_ROLE_LABELS[selectedRole]}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.values(UserRole).map((role) => {
                const RoleIcon = roleIcons[role];
                return (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-4 w-4" />
                      {USER_ROLE_LABELS[role]}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="reason" className="text-sm font-medium">
            Reason for Change
          </Label>
          <Textarea
            id="reason"
            placeholder="Enter the reason for this role change..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            className="mt-1"
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleRoleAssignment}
            disabled={isSubmitting || selectedRole === user.role || !reason.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-md p-2">
          <strong>Important:</strong> Changing a user's role will invalidate their current session, requiring them to sign in again.
        </div>
      </CardContent>
    </Card>
  );
}