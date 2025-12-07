'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Assignment, Provider } from '@/lib/types';

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-100 shadow-lg rounded-lg">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

interface AttendanceChartProps {
  assignments: Assignment[];
  providers: Provider[];
}

export function AttendanceChart({ assignments, providers }: AttendanceChartProps) {
  const data = assignments
    .filter((a) => a.status === 'accepted' && a.actual_managers !== null)
    .map((assignment) => {
      const provider = providers.find((p) => p.id === assignment.provider_id);
      const totalAssigned =
        assignment.assigned_managers +
        assignment.assigned_supervisors +
        assignment.assigned_sia +
        assignment.assigned_stewards;
      const totalActual =
        (assignment.actual_managers || 0) +
        (assignment.actual_supervisors || 0) +
        (assignment.actual_sia || 0) +
        (assignment.actual_stewards || 0);
      const attendanceRate = totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0;

      return {
        name: provider?.company_name || 'Unknown',
        assigned: totalAssigned,
        actual: totalActual,
        rate: Math.round(attendanceRate),
      };
    });

  if (data.length === 0) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <CardTitle>Attendance Rate</CardTitle>
          <CardDescription>No attendance data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Attendance Rate by Provider</CardTitle>
        <CardDescription>Comparison of assigned vs actual attendance</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorAssigned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#64748b" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar 
              dataKey="assigned" 
              fill="url(#colorAssigned)" 
              name="Assigned" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50}
            />
            <Bar 
              dataKey="actual" 
              fill="url(#colorActual)" 
              name="Actual" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface AttendanceRateChartProps {
  assignments: Assignment[];
  providers: Provider[];
}

export function AttendanceRateChart({ assignments, providers }: AttendanceRateChartProps) {
  const data = assignments
    .filter((a) => a.status === 'accepted' && a.actual_managers !== null)
    .map((assignment) => {
      const provider = providers.find((p) => p.id === assignment.provider_id);
      const totalAssigned =
        assignment.assigned_managers +
        assignment.assigned_supervisors +
        assignment.assigned_sia +
        assignment.assigned_stewards;
      const totalActual =
        (assignment.actual_managers || 0) +
        (assignment.actual_supervisors || 0) +
        (assignment.actual_sia || 0) +
        (assignment.actual_stewards || 0);
      const attendanceRate = totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0;

      return {
        name: provider?.company_name || 'Unknown',
        rate: Math.round(attendanceRate),
      };
    })
    .sort((a, b) => b.rate - a.rate);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Attendance Rate %</CardTitle>
        <CardDescription>Attendance percentage by provider</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={80} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area 
              type="monotone" 
              dataKey="rate" 
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorRate)" 
              name="Attendance Rate %"
              strokeWidth={3}
            />
            <Line
              type="monotone"
              dataKey={() => 95}
              stroke="#10b981"
              strokeDasharray="5 5"
              name="Target (95%)"
              strokeWidth={2}
              dot={false}
              activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface StatusDistributionChartProps {
  assignments: Assignment[];
}

export function StatusDistributionChart({ assignments }: StatusDistributionChartProps) {
  const statusCounts = assignments.reduce(
    (acc, assignment) => {
      acc[assignment.status] = (acc[assignment.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const data = [
    { name: 'Accepted', value: statusCounts.accepted || 0, color: '#10b981' }, // emerald-500
    { name: 'Pending', value: statusCounts.pending || 0, color: '#f59e0b' },   // amber-500
    { name: 'Declined', value: statusCounts.declined || 0, color: '#ef4444' }, // red-500
  ].filter((item) => item.value > 0);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Assignment Status Distribution</CardTitle>
        <CardDescription>Breakdown of assignment statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip />
            <Legend 
              verticalAlign="middle" 
              align="right"
              layout="vertical"
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface ProviderPerformanceChartProps {
  assignments: Assignment[];
  providers: Provider[];
}

export function ProviderPerformanceChart({ assignments, providers }: ProviderPerformanceChartProps) {
  const providerStats = providers.map((provider) => {
    const providerAssignments = assignments.filter((a) => a.provider_id === provider.id);
    const accepted = providerAssignments.filter((a) => a.status === 'accepted').length;
    const pending = providerAssignments.filter((a) => a.status === 'pending').length;
    const declined = providerAssignments.filter((a) => a.status === 'declined').length;

    return {
      name: provider.company_name,
      accepted,
      pending,
      declined,
    };
  });

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader>
        <CardTitle>Provider Performance</CardTitle>
        <CardDescription>Assignment status by provider</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={providerStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
            <XAxis type="number" tickLine={false} axisLine={false} />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={120} 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="accepted" stackId="a" fill="#10b981" name="Accepted" radius={[0, 4, 4, 0]} />
            <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
            <Bar dataKey="declined" stackId="a" fill="#ef4444" name="Declined" radius={[4, 0, 0, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
