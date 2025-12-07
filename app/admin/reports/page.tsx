'use client';

import { useState, useMemo, useEffect } from 'react';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AttendanceTrendChart } from '@/components/admin/AttendanceTrendChart';
import { StatusDistributionChart, ProviderPerformanceChart } from '@/components/admin/KPICharts';
import { Download, Calendar, TrendingUp, Users, CheckCircle, Printer } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { exportEventsToCSV, exportAssignmentsToCSV, downloadCSV } from '@/lib/export';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function ReportsPage() {
  const { events, assignments, providers, loadEvents, loadAssignments, loadProviders } = useDataStore();
  
  useEffect(() => {
    loadEvents();
    loadAssignments();
    loadProviders();
  }, [loadEvents, loadAssignments, loadProviders]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [reportType, setReportType] = useState<'overview' | 'attendance' | 'providers' | 'events'>('overview');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Filter data based on date range
  const filteredData = useMemo(() => {
    if (!dateRange) {
      return {
        events: events,
        assignments: assignments,
      };
    }

    const filteredEvents = events.filter((event) => {
      const eventDate = parseISO(event.date);
      return isWithinInterval(eventDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to),
      });
    });

    const eventIds = new Set(filteredEvents.map((e) => e.id));
    const filteredAssignments = assignments.filter((a) => eventIds.has(a.event_id));

    return {
      events: filteredEvents,
      assignments: filteredAssignments,
    };
  }, [events, assignments, dateRange]);

  // Filter by provider if selected
  const providerFilteredAssignments = useMemo(() => {
    if (selectedProvider === 'all') {
      return filteredData.assignments;
    }
    return filteredData.assignments.filter((a) => a.provider_id === selectedProvider);
  }, [filteredData.assignments, selectedProvider]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalEvents = filteredData.events.length;
    const totalAssignments = providerFilteredAssignments.length;
    const accepted = providerFilteredAssignments.filter((a) => a.status === 'accepted').length;
    const pending = providerFilteredAssignments.filter((a) => a.status === 'pending').length;
    const declined = providerFilteredAssignments.filter((a) => a.status === 'declined').length;

    // Calculate attendance metrics
    const completedAssignments = providerFilteredAssignments.filter(
      (a) => a.status === 'accepted' && a.actual_managers !== null
    );

    let totalAssigned = 0;
    let totalActual = 0;
    completedAssignments.forEach((a) => {
      totalAssigned +=
        a.assigned_managers + a.assigned_supervisors + a.assigned_sia + a.assigned_stewards;
      totalActual +=
        (a.actual_managers || 0) +
        (a.actual_supervisors || 0) +
        (a.actual_sia || 0) +
        (a.actual_stewards || 0);
    });

    const avgAttendanceRate =
      totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0;

    return {
      totalEvents,
      totalAssignments,
      accepted,
      pending,
      declined,
      avgAttendanceRate,
      totalAssigned,
      totalActual,
    };
  }, [filteredData, providerFilteredAssignments]);

  const handleExport = () => {
    if (reportType === 'events') {
      const csvData = exportEventsToCSV(filteredData.events);
      downloadCSV(csvData, `events-report-${dateRange ? format(dateRange.from, 'yyyy-MM-dd') : 'all'}.csv`);
    } else if (reportType === 'attendance' || reportType === 'overview') {
      const csvData = exportAssignmentsToCSV(providerFilteredAssignments, filteredData.events, providers);
      downloadCSV(
        csvData,
        `assignments-report-${dateRange ? format(dateRange.from, 'yyyy-MM-dd') : 'all'}.csv`
      );
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Reports' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold">Custom Reports</h1>
        <p className="text-gray-600 mt-1">Generate detailed reports with custom date ranges and filters</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Configure your report parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="providers">Provider Performance</SelectItem>
                  <SelectItem value="events">Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-end gap-2">
                <div className="space-y-2 flex-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    value={dateRange ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const from = new Date(e.target.value);
                        const to = dateRange?.to || from;
                        setDateRange({ from, to });
                      }
                    }}
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    value={dateRange ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                    min={dateRange ? format(dateRange.from, 'yyyy-MM-dd') : undefined}
                    onChange={(e) => {
                      if (e.target.value && dateRange) {
                        setDateRange({ ...dateRange, to: new Date(e.target.value) });
                      }
                    }}
                  />
                </div>
                {dateRange && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDateRange(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="print-keep">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
            {dateRange && (
              <Button
                variant="ghost"
                onClick={() => setDateRange(null)}
                className="text-sm"
              >
                Clear Date Range
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange
                ? `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                : 'All time'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <div className="flex gap-1 mt-1">
              <Badge variant="success" className="text-xs">
                {stats.accepted}
              </Badge>
              <Badge variant="warning" className="text-xs">
                {stats.pending}
              </Badge>
              {stats.declined > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.declined}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgAttendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalActual}/{stats.totalAssigned} staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAssignments > 0
                ? ((stats.accepted / stats.totalAssignments) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.accepted} of {stats.totalAssignments} accepted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      {reportType === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <StatusDistributionChart assignments={providerFilteredAssignments} />
          <ProviderPerformanceChart
            assignments={providerFilteredAssignments}
            providers={providers}
          />
        </div>
      )}

      {reportType === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trends</CardTitle>
            <CardDescription>
              Attendance performance over the selected date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceTrendChart
              assignments={providerFilteredAssignments}
              events={filteredData.events}
              days={dateRange ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) : 30}
            />
          </CardContent>
        </Card>
      )}

      {reportType === 'providers' && (
        <Card>
          <CardHeader>
            <CardTitle>Provider Performance</CardTitle>
            <CardDescription>Performance metrics by provider</CardDescription>
          </CardHeader>
          <CardContent>
            <ProviderPerformanceChart
              assignments={providerFilteredAssignments}
              providers={providers}
            />
          </CardContent>
        </Card>
      )}

      {reportType === 'events' && (
        <Card>
          <CardHeader>
            <CardTitle>Events List</CardTitle>
            <CardDescription>
              {filteredData.events.length} event{filteredData.events.length !== 1 ? 's' : ''} in
              selected range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredData.events.length > 0 ? (
                filteredData.events.map((event) => {
                  const eventAssignments = providerFilteredAssignments.filter(
                    (a) => a.event_id === event.id
                  );
                  return (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{event.name}</p>
                        <p className="text-sm text-gray-600">
                          {format(parseISO(event.date), 'MMM dd, yyyy')} • {event.location}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {eventAssignments.length} assignment{eventAssignments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {eventAssignments.filter((a) => a.status === 'accepted').length} confirmed
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-8">No events in selected date range</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

