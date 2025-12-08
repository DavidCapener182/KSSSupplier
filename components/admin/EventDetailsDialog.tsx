'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import type { Event, Assignment, Provider } from '@/lib/types';
import { MapPin, Calendar, Mail, Phone, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface EventDetailsDialogProps {
  event: Event | null;
  assignments: Assignment[];
  providers: Provider[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsDialog({
  event,
  assignments,
  providers,
  open,
  onOpenChange,
}: EventDetailsDialogProps) {
  if (!event) return null;

  const eventAssignments = assignments.filter((a) => a.event_id === event.id);
  const totalAssigned = eventAssignments.reduce(
    (acc, a) => ({
      managers: acc.managers + a.assigned_managers,
      supervisors: acc.supervisors + a.assigned_supervisors,
      sia: acc.sia + a.assigned_sia,
      stewards: acc.stewards + a.assigned_stewards,
    }),
    { managers: 0, supervisors: 0, sia: 0, stewards: 0 }
  );

  const confirmed = eventAssignments.filter((a) => a.status === 'accepted').length;
  const pending = eventAssignments.filter((a) => a.status === 'pending').length;
  const declined = eventAssignments.filter((a) => a.status === 'declined').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.name}</DialogTitle>
          <DialogDescription>Event details and provider assignments</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Event Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Event Date</span>
              </div>
              <p className="font-medium">
                {format(new Date(event.date), 'EEEE, MMMM dd, yyyy')}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </div>
              <p className="font-medium">{event.location}</p>
            </div>
          </div>

          {/* Staff Requirements vs Assigned */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Staff Requirements</CardTitle>
              <CardDescription>Required vs Currently Assigned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {event.requirements.managers > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Managers</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{totalAssigned.managers}</p>
                      <span className="text-sm text-muted-foreground">
                        / {event.requirements.managers}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          totalAssigned.managers >= event.requirements.managers
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (totalAssigned.managers / event.requirements.managers) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {event.requirements.supervisors > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Supervisors</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{totalAssigned.supervisors}</p>
                      <span className="text-sm text-muted-foreground">
                        / {event.requirements.supervisors}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          totalAssigned.supervisors >= event.requirements.supervisors
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (totalAssigned.supervisors / event.requirements.supervisors) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {event.requirements.sia > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">SIA Licensed</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{totalAssigned.sia}</p>
                      <span className="text-sm text-muted-foreground">
                        / {event.requirements.sia}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          totalAssigned.sia >= event.requirements.sia
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (totalAssigned.sia / event.requirements.sia) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                {event.requirements.stewards > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Stewards</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold">{totalAssigned.stewards}</p>
                      <span className="text-sm text-muted-foreground">
                        / {event.requirements.stewards}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          totalAssigned.stewards >= event.requirements.stewards
                            ? 'bg-green-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (totalAssigned.stewards / event.requirements.stewards) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Labour Provider Assignments</CardTitle>
              <CardDescription>
                {eventAssignments.length} assignment{eventAssignments.length !== 1 ? 's' : ''} •{' '}
                {confirmed} confirmed, {pending} pending
                {declined > 0 && `, ${declined} declined`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventAssignments.length > 0 ? (
                <div className="space-y-3">
                  {eventAssignments.map((assignment) => {
                    const provider = providers.find((p) => p.id === assignment.provider_id);
                    if (!provider) return null;

                    const getStatusBadge = () => {
                      switch (assignment.status) {
                        case 'accepted':
                          return <Badge variant="success">Accepted</Badge>;
                        case 'declined':
                          return <Badge variant="destructive">Declined</Badge>;
                        default:
                          return <Badge variant="warning">Pending</Badge>;
                      }
                    };

                    return (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <h4 className="font-semibold">{provider.company_name}</h4>
                              {getStatusBadge()}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground">Managers:</span>{' '}
                                <span className="font-medium">{assignment.assigned_managers}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">Supervisors:</span>{' '}
                                <span className="font-medium">{assignment.assigned_supervisors}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">SIA:</span>{' '}
                                <span className="font-medium">{assignment.assigned_sia}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-muted-foreground">Stewards:</span>{' '}
                                <span className="font-medium">{assignment.assigned_stewards}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contact Details */}
                        <div className="pt-2 border-t space-y-1 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{provider.contact_email}</span>
                          </div>
                          {provider.contact_phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{provider.contact_phone}</span>
                            </div>
                          )}
                          {provider.address && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{provider.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No provider assignments yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end">
            <Link href={`/admin/events/${event.id}`}>
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Event Details
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

