'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Assignment, Provider } from '@/lib/types';
import { CheckCircle, XCircle, Clock, Edit, Trash2, FileCheck } from 'lucide-react';

interface AssignmentRowProps {
  assignment: Assignment;
  provider: Provider;
  onRequestDetails: (assignmentId: string) => void;
  onViewDetails?: (assignmentId: string) => void;
  onSendTimes?: (assignment: Assignment) => void;
  onConfirmTimesheets?: (assignment: Assignment) => void;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (assignmentId: string) => void;
  availabilityStatus?: 'available' | 'unavailable' | undefined;
  eventDate?: string; // Event date to check if event has passed
  hasStaffDetailsUploaded?: boolean; // Whether staff details have been uploaded
}

export function AssignmentRow({ assignment, provider, onRequestDetails, onViewDetails, onSendTimes, onConfirmTimesheets, onEdit, onDelete, availabilityStatus, eventDate, hasStaffDetailsUploaded = false }: AssignmentRowProps) {
  // If provider accepted assignment, treat availability as available
  const effectiveAvailability: 'available' | 'unavailable' | undefined =
    assignment.status === 'accepted'
      ? 'available'
      : availabilityStatus;
  const getStatusBadge = () => {
    switch (assignment.status) {
      case 'accepted':
        return (
          <Badge variant="success" className="flex items-center space-x-1">
            <CheckCircle className="h-3 w-3" />
            <span>Accepted</span>
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="destructive" className="flex items-center space-x-1">
            <XCircle className="h-3 w-3" />
            <span>Declined</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="warning" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold">{provider.company_name}</h4>
          <p className="text-sm text-gray-600">{provider.contact_email}</p>
          {availabilityStatus && (
            <div className="mt-1">
              {availabilityStatus === 'available' && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 border-transparent">Available</Badge>
              )}
              {availabilityStatus === 'unavailable' && (
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-transparent">Unavailable</Badge>
              )}
            </div>
          )}
          {!availabilityStatus && (
            <div className="mt-1">
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-transparent">No response</Badge>
            </div>
          )}
        </div>
        {getStatusBadge()}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Managers:</span>
          <span className="ml-2 font-medium">{assignment.assigned_managers}</span>
        </div>
        <div>
          <span className="text-gray-600">Supervisors:</span>
          <span className="ml-2 font-medium">{assignment.assigned_supervisors}</span>
        </div>
        <div>
          <span className="text-gray-600">SIA:</span>
          <span className="ml-2 font-medium">{assignment.assigned_sia}</span>
        </div>
        <div>
          <span className="text-gray-600">Stewards:</span>
          <span className="ml-2 font-medium">{assignment.assigned_stewards}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t gap-3">
        {assignment.status === 'accepted' && (
          <div className="text-sm text-gray-600 space-y-1">
            {assignment.details_requested && (
              <div>
                <span className="text-green-600">Staff details requested</span>
                {assignment.times_sent && <span className="text-green-600 ml-2">• Staff times sent</span>}
              </div>
            )}
            {!assignment.details_requested && assignment.times_sent && (
              <div>
                <span className="text-green-600">Staff times sent</span>
              </div>
            )}
            {assignment.timesheets_confirmed && (
               <div>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <FileCheck className="h-3 w-3" />
                  Timesheets Confirmed
                </span>
               </div>
            )}
            {!assignment.details_requested && !assignment.times_sent && !assignment.timesheets_confirmed && (
              <span>Staff details and times not yet requested</span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-end sm:justify-end gap-2 w-full sm:w-auto">
          {assignment.status === 'accepted' && !assignment.details_requested && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onRequestDetails(assignment.id)}
            >
              <span className="hidden sm:inline">Request PNC/SIA Details</span>
              <span className="sm:hidden">Request Details</span>
            </Button>
          )}
          {assignment.status === 'accepted' && assignment.details_requested && hasStaffDetailsUploaded && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onViewDetails ? onViewDetails(assignment.id) : undefined}
            >
              <span className="hidden sm:inline">View PNC/SIA Details</span>
              <span className="sm:hidden">View Details</span>
            </Button>
          )}
          {assignment.status === 'accepted' && onSendTimes && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onSendTimes(assignment)}
            >
              <Clock className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{assignment.times_sent ? 'Update Times' : 'Send Times'}</span>
              <span className="sm:hidden">{assignment.times_sent ? 'Update' : 'Send'}</span>
            </Button>
          )}
          {assignment.status === 'accepted' && onConfirmTimesheets && !assignment.timesheets_confirmed && (() => {
            // Only show Confirm Timesheets button if event date has passed
            const eventHasPassed = eventDate ? new Date(eventDate) < new Date() : false;
            return eventHasPassed ? (
              <Button
                variant="default" 
                size="sm"
                className="flex-shrink-0 bg-green-600 hover:bg-green-700"
                onClick={() => onConfirmTimesheets(assignment)}
              >
                <FileCheck className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Confirm Timesheets</span>
                <span className="sm:hidden">Confirm</span>
              </Button>
            ) : null;
          })()}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onEdit(assignment)}
              aria-label={`Edit assignment for ${provider.company_name}`}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              className="flex-shrink-0"
              onClick={() => onDelete(assignment.id)}
              aria-label={`Delete assignment for ${provider.company_name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
