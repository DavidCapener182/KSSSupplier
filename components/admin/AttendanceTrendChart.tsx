'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Assignment, Event } from '@/lib/types';
import { format, subDays, startOfDay } from 'date-fns';

interface AttendanceTrendChartProps {
  assignments: Assignment[];
  events?: Event[]; // Optional events array to get actual event dates
  days?: number; // Number of days to show (default: 30)
}

export function AttendanceTrendChart({ assignments, events = [], days = 30 }: AttendanceTrendChartProps) {
  const data = useMemo(() => {
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, days - 1);

    // Get all completed assignments (with actual attendance)
    const completedAssignments = assignments.filter(
      (a) => a.status === 'accepted' && a.actual_managers !== null
    );

    // Group by date
    const dateMap = new Map<string, { date: string; assigned: number; actual: number; rate: number }>();

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const date = subDays(endDate, days - 1 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      dateMap.set(dateKey, { date: format(date, 'MMM dd'), assigned: 0, actual: 0, rate: 0 });
    }

    // Process assignments
    completedAssignments.forEach((assignment) => {
      // Try to find the event date from events array, otherwise use accepted_at as proxy
      const event = events.find((e) => e.id === assignment.event_id);
      const eventDate = event
        ? new Date(event.date)
        : assignment.accepted_at
        ? new Date(assignment.accepted_at)
        : new Date();
      const dateKey = format(startOfDay(eventDate), 'yyyy-MM-dd');

      if (dateMap.has(dateKey)) {
        const entry = dateMap.get(dateKey)!;
        const assigned =
          assignment.assigned_managers +
          assignment.assigned_supervisors +
          assignment.assigned_sia +
          assignment.assigned_stewards;
        const actual =
          (assignment.actual_managers || 0) +
          (assignment.actual_supervisors || 0) +
          (assignment.actual_sia || 0) +
          (assignment.actual_stewards || 0);

        entry.assigned += assigned;
        entry.actual += actual;
      }
    });

    // Calculate rates
    const result = Array.from(dateMap.values()).map((entry) => ({
      ...entry,
      rate: entry.assigned > 0 ? (entry.actual / entry.assigned) * 100 : 0,
    }));

    return result;
  }, [assignments, events, days]);

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            yAxisId="left"
            label={{ value: 'Staff Count', angle: -90, position: 'insideLeft' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: 'Attendance Rate %', angle: 90, position: 'insideRight' }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
            formatter={(value: number, name: string) => {
              if (name === 'rate') {
                return [`${value.toFixed(1)}%`, 'Attendance Rate'];
              }
              return [value, name === 'assigned' ? 'Assigned' : 'Actual'];
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="assigned"
            stroke="#8884d8"
            name="Assigned Staff"
            strokeWidth={2}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="actual"
            stroke="#82ca9d"
            name="Actual Attendance"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="rate"
            stroke="#ffc658"
            name="Attendance Rate"
            strokeWidth={2}
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

