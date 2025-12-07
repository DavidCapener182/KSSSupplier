'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import type { Assignment } from '@/lib/types';

interface AttendanceInputProps {
  assignment: Assignment;
  providerName: string;
  onSave: (assignmentId: string, attendance: {
    actual_managers: number;
    actual_supervisors: number;
    actual_sia: number;
    actual_stewards: number;
  }) => void;
}

export function AttendanceInput({ assignment, providerName, onSave }: AttendanceInputProps) {
  const { toast } = useToast();
  const [attendance, setAttendance] = useState({
    actual_managers: assignment.actual_managers?.toString() || '',
    actual_supervisors: assignment.actual_supervisors?.toString() || '',
    actual_sia: assignment.actual_sia?.toString() || '',
    actual_stewards: assignment.actual_stewards?.toString() || '',
  });

  const handleSave = () => {
    onSave(assignment.id, {
      actual_managers: parseInt(attendance.actual_managers) || 0,
      actual_supervisors: parseInt(attendance.actual_supervisors) || 0,
      actual_sia: parseInt(attendance.actual_sia) || 0,
      actual_stewards: parseInt(attendance.actual_stewards) || 0,
    });

    toast({
      title: 'Attendance Recorded',
      description: `Attendance for ${providerName} has been saved.`,
      variant: 'success',
    });
  };

  const totalAssigned =
    assignment.assigned_managers +
    assignment.assigned_supervisors +
    assignment.assigned_sia +
    assignment.assigned_stewards;

  const totalActual =
    (parseInt(attendance.actual_managers) || 0) +
    (parseInt(attendance.actual_supervisors) || 0) +
    (parseInt(attendance.actual_sia) || 0) +
    (parseInt(attendance.actual_stewards) || 0);

  const attendanceRate = totalAssigned > 0 ? ((totalActual / totalAssigned) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Attendance - {providerName}</CardTitle>
        <CardDescription>Enter the actual number of staff who attended</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Managers</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max={assignment.assigned_managers}
                value={attendance.actual_managers}
                onChange={(e) =>
                  setAttendance({ ...attendance, actual_managers: e.target.value })
                }
                placeholder="0"
              />
              <span className="text-sm text-gray-500">
                / {assignment.assigned_managers} assigned
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Supervisors</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max={assignment.assigned_supervisors}
                value={attendance.actual_supervisors}
                onChange={(e) =>
                  setAttendance({ ...attendance, actual_supervisors: e.target.value })
                }
                placeholder="0"
              />
              <span className="text-sm text-gray-500">
                / {assignment.assigned_supervisors} assigned
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>SIA Licensed</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max={assignment.assigned_sia}
                value={attendance.actual_sia}
                onChange={(e) => setAttendance({ ...attendance, actual_sia: e.target.value })}
                placeholder="0"
              />
              <span className="text-sm text-gray-500">/ {assignment.assigned_sia} assigned</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Stewards</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max={assignment.assigned_stewards}
                value={attendance.actual_stewards}
                onChange={(e) =>
                  setAttendance({ ...attendance, actual_stewards: e.target.value })
                }
                placeholder="0"
              />
              <span className="text-sm text-gray-500">
                / {assignment.assigned_stewards} assigned
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Assigned:</span>
            <span className="text-sm">{totalAssigned}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Actual:</span>
            <span className="text-sm">{totalActual}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Attendance Rate:</span>
            <span
              className={`text-sm font-bold ${
                parseFloat(attendanceRate) >= 95
                  ? 'text-green-600'
                  : parseFloat(attendanceRate) >= 80
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {attendanceRate}%
            </span>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Attendance
        </Button>
      </CardContent>
    </Card>
  );
}


