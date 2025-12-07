'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Provider, Assignment } from '@/lib/types';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, Clock, Star } from 'lucide-react';
import { format } from 'date-fns';

interface ProviderScorecardProps {
  provider: Provider;
  assignments: Assignment[];
  events: any[];
}

export function ProviderScorecard({ provider, assignments, events }: ProviderScorecardProps) {
  const providerAssignments = assignments.filter((a) => a.provider_id === provider.id);
  const accepted = providerAssignments.filter((a) => a.status === 'accepted').length;
  const pending = providerAssignments.filter((a) => a.status === 'pending').length;
  const declined = providerAssignments.filter((a) => a.status === 'declined').length;

  // Calculate attendance metrics
  const completedAssignments = providerAssignments.filter(
    (a) => a.status === 'accepted' && a.actual_managers !== null
  );

  const calculateAttendanceRate = (assignment: Assignment) => {
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
    return totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0;
  };

  const attendanceRates = completedAssignments.map(calculateAttendanceRate);
  const avgAttendanceRate =
    attendanceRates.length > 0
      ? attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length
      : 0;

  // Calculate acceptance rate
  const totalOffers = providerAssignments.length;
  const acceptanceRate = totalOffers > 0 ? (accepted / totalOffers) * 100 : 0;

  // Calculate performance score (0-100)
  const performanceScore =
    (acceptanceRate * 0.4 + avgAttendanceRate * 0.6) || 0;

  // Get recent assignments
  const recentAssignments = providerAssignments
    .sort((a, b) => {
      const dateA = a.accepted_at ? new Date(a.accepted_at).getTime() : 0;
      const dateB = b.accepted_at ? new Date(b.accepted_at).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{provider.company_name}</CardTitle>
            <CardDescription>{provider.contact_email}</CardDescription>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getScoreColor(performanceScore)}`}>
              {performanceScore.toFixed(0)}
            </div>
            <Badge variant={getScoreBadge(performanceScore) as any} className="mt-1">
              <Star className="h-3 w-3 mr-1" />
              Performance Score
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Acceptance Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{acceptanceRate.toFixed(1)}%</p>
              {acceptanceRate >= 80 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <Progress value={acceptanceRate} className="h-2 mt-1" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Avg Attendance</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-semibold">{avgAttendanceRate.toFixed(1)}%</p>
              {avgAttendanceRate >= 95 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : avgAttendanceRate >= 80 ? (
                <TrendingDown className="h-4 w-4 text-yellow-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <Progress value={avgAttendanceRate} className="h-2 mt-1" />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Events</p>
            <p className="text-lg font-semibold">{totalOffers}</p>
            <div className="flex gap-1 mt-1">
              <Badge variant="success" className="text-xs">
                {accepted}
              </Badge>
              <Badge variant="warning" className="text-xs">
                {pending}
              </Badge>
              {declined > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {declined}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Recent Activity</p>
          <div className="space-y-2">
            {recentAssignments.length > 0 ? (
              recentAssignments.map((assignment) => {
                const event = events.find((e) => e.id === assignment.event_id);
                const attendanceRate = calculateAttendanceRate(assignment);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {assignment.status === 'accepted' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : assignment.status === 'pending' ? (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>{event?.name || 'Unknown Event'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {assignment.status === 'accepted' && assignment.actual_managers !== null && (
                        <span className="text-xs text-gray-600">
                          {attendanceRate.toFixed(0)}% attendance
                        </span>
                      )}
                      <Badge
                        variant={
                          assignment.status === 'accepted'
                            ? 'success'
                            : assignment.status === 'pending'
                            ? 'warning'
                            : 'destructive'
                        }
                        className="text-xs"
                      >
                        {assignment.status}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

