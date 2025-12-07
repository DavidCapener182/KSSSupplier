'use client';

import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { useMockDataStore } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, AlertCircle, ArrowRight, MapPin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { assignments, events, providers, loadEvents, loadAssignments, loadProviders, acceptAssignment, declineAssignment } = useDataStore();
  const { providers: mockProviders } = useMockDataStore(); // Get mock providers for mock auth lookup
  
  // Check if using mock auth (user ID starts with 'user-' or 'admin-')
  const isMockAuth = user?.id?.startsWith('user-') || user?.id?.startsWith('admin-');
  
  useEffect(() => {
    loadEvents();
    loadAssignments();
    loadProviders();
  }, [loadEvents, loadAssignments, loadProviders]);

  // Find provider by matching user_id
  // Use mock providers if using mock auth, otherwise use Supabase providers
  const mockProvider = isMockAuth && user
    ? mockProviders.find((p) => p.user_id === user.id)
    : null;
    
  // If using mock auth, find the corresponding Supabase provider by company name/email
  // This is needed because assignments in Supabase use UUID provider_ids
  const provider = isMockAuth && mockProvider
    ? providers.find((p) => 
        p.company_name === mockProvider.company_name || 
        p.contact_email === mockProvider.contact_email
      ) || mockProvider // Fallback to mock provider if not found in Supabase
    : providers.find((p) => p.user_id === user?.id);
  
  // For assignments, use the Supabase provider ID if available (for UUID matching)
  // Otherwise use the mock provider ID
  const providerIdForAssignments = isMockAuth && mockProvider && provider && provider.id !== mockProvider.id
    ? provider.id // Use Supabase UUID
    : provider?.id; // Use provider ID (either mock or Supabase)
  
  const providerAssignments = providerIdForAssignments
    ? assignments.filter((a) => a.provider_id === providerIdForAssignments)
    : [];

  const pendingAssignments = providerAssignments.filter((a) => a.status === 'pending');
  const confirmedAssignments = providerAssignments.filter((a) => a.status === 'accepted');
  const upcomingEvents = providerAssignments
    .filter((a) => a.status === 'accepted')
    .map((a) => {
      const event = events.find((e) => e.id === a.event_id);
      return { assignment: a, event };
    })
    .filter((item): item is { assignment: typeof providerAssignments[0]; event: typeof events[0] } => item.event !== undefined)
    .filter((item) => new Date(item.event.date) >= new Date())
    .sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())
    .slice(0, 5);

  const totalStaffCommitted = confirmedAssignments.reduce(
    (acc, a) =>
      acc +
      a.assigned_managers +
      a.assigned_supervisors +
      a.assigned_sia +
      a.assigned_stewards,
    0
  );

  return (
    <div className="space-y-8 p-2">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Welcome back, {provider?.company_name || 'Provider'}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-amber-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Response</CardTitle>
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{pendingAssignments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting your response</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-green-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-600">Confirmed Events</CardTitle>
            <div className="p-2 bg-green-100 rounded-full text-green-600">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{confirmedAssignments.length}</div>
            <p className="text-xs text-gray-500 mt-1">Accepted assignments</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-blue-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-600">Total Staff</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full text-blue-600">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{totalStaffCommitted}</div>
            <p className="text-xs text-gray-500 mt-1">Staff committed</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-purple-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-gray-600">Upcoming</CardTitle>
            <div className="p-2 bg-purple-100 rounded-full text-purple-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-gray-900">{upcomingEvents.length}</div>
            <p className="text-xs text-gray-500 mt-1">Events this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Pending Response
            </CardTitle>
            <CardDescription>Events requiring your confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingAssignments.length > 0 ? (
                pendingAssignments.map((assignment) => {
                  const event = events.find((e) => e.id === assignment.event_id);
                  if (!event) return null;
                  return (
                    <div key={assignment.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                      <div className="p-4 border-b bg-slate-50/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg">{event.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3 w-3" /> {event.location}
                              <Separator orientation="vertical" className="h-3" />
                              <Calendar className="h-3 w-3" /> {format(new Date(event.date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Action Required</Badge>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {assignment.assigned_managers > 0 && (
                            <div className="p-2 bg-slate-50 rounded border">
                              <span className="block text-muted-foreground text-xs">Managers</span>
                              <span className="font-medium text-lg">{assignment.assigned_managers}</span>
                            </div>
                          )}
                          {assignment.assigned_supervisors > 0 && (
                            <div className="p-2 bg-slate-50 rounded border">
                              <span className="block text-muted-foreground text-xs">Supervisors</span>
                              <span className="font-medium text-lg">{assignment.assigned_supervisors}</span>
                            </div>
                          )}
                          {assignment.assigned_sia > 0 && (
                            <div className="p-2 bg-slate-50 rounded border">
                              <span className="block text-muted-foreground text-xs">SIA Security</span>
                              <span className="font-medium text-lg">{assignment.assigned_sia}</span>
                            </div>
                          )}
                          {assignment.assigned_stewards > 0 && (
                            <div className="p-2 bg-slate-50 rounded border">
                              <span className="block text-muted-foreground text-xs">Stewards</span>
                              <span className="font-medium text-lg">{assignment.assigned_stewards}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700 flex-1"
                            onClick={async () => {
                              try {
                                await acceptAssignment(assignment.id);
                                await loadAssignments();
                                toast({
                                  title: 'Assignment Accepted',
                                  description: 'You have successfully accepted this assignment.',
                                  variant: 'default',
                                });
                              } catch (error: any) {
                                toast({
                                  title: 'Error',
                                  description: error?.message || 'Failed to accept assignment. Please try again.',
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            Accept Assignment
                          </Button>
                          <Button 
                            variant="outline" 
                            className="w-full text-red-600 hover:bg-red-50 border-red-200 flex-1"
                            onClick={async () => {
                              try {
                                await declineAssignment(assignment.id);
                                await loadAssignments();
                                toast({
                                  title: 'Assignment Declined',
                                  description: 'You have declined this assignment.',
                                  variant: 'default',
                                });
                              } catch (error: any) {
                                toast({
                                  title: 'Error',
                                  description: error?.message || 'Failed to decline assignment. Please try again.',
                                  variant: 'destructive',
                                });
                              }
                            }}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No pending assignments</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Upcoming Confirmed Events
            </CardTitle>
            <CardDescription>Your confirmed assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(({ assignment, event }) => (
                  <div key={assignment.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                      <Link
                        href={`/provider/events/${event.id}`}
                        className="font-semibold text-gray-900 hover:text-primary transition-colors"
                      >
                        {event.name}
                      </Link>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200 border-none">
                        Confirmed
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(event.date), 'MMM dd, yyyy')} • {event.location}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg mb-4 group-hover:bg-green-50/30 transition-colors">
                      {assignment.assigned_managers > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Managers:</span>
                          <span className="font-medium">{assignment.assigned_managers}</span>
                        </div>
                      )}
                      {assignment.assigned_supervisors > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Supervisors:</span>
                          <span className="font-medium">{assignment.assigned_supervisors}</span>
                        </div>
                      )}
                      {assignment.assigned_sia > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">SIA:</span>
                          <span className="font-medium">{assignment.assigned_sia}</span>
                        </div>
                      )}
                      {assignment.assigned_stewards > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stewards:</span>
                          <span className="font-medium">{assignment.assigned_stewards}</span>
                        </div>
                      )}
                    </div>
                    <Link href={`/provider/events/${event.id}`}>
                      <Button variant="ghost" className="w-full hover:bg-green-50 hover:text-green-700 group-hover:translate-x-1 transition-all">
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No upcoming events</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
