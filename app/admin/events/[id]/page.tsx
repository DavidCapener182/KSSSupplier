'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { useAuth } from '@/lib/auth-context';
import type { Assignment } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AssignmentRow } from '@/components/admin/AssignmentRow';
import { ConfirmTimesheetsDialog } from '@/components/admin/ConfirmTimesheetsDialog';
import { AttendanceInput } from '@/components/admin/AttendanceInput';
import { AttendanceChart, AttendanceRateChart } from '@/components/admin/KPICharts';
import { AttendanceTrendChart } from '@/components/admin/AttendanceTrendChart';
import { FileUpload } from '@/components/shared/FileUpload';
import { DocumentComments } from '@/components/shared/DocumentComments';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Plus, Upload, FileText, Edit, Trash2, Calendar, HelpCircle, Download, Printer, FileBarChart } from 'lucide-react';
import { generateEventSummaryPDF, generateInvoicePDF, generatePncSiaPDF } from '@/lib/pdf-export';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    events, 
    providers: supabaseProviders, 
    assignments, 
    availability,
    createAssignment, 
    updateAssignment, 
    deleteAssignment, 
    updateEvent, 
    deleteEvent, 
    getDocumentsByEvent, 
    uploadDocument, 
    addDocumentComment, 
    getDocumentComments, 
    currentUser,
    loadEvents,
    loadAssignments,
    loadProviders,
    loadEventAvailability,
    loadDocuments,
    addNotification,
    createStaffTimes,
    deleteStaffTimesByAssignment,
    getStaffTimesByAssignment,
    loadStaffTimes,
    loadInvoices,
    invoices,
    uploadInvoice,
    updateInvoiceStatus,
    getStaffDetailsByAssignment,
    loadStaffDetails,
    isLoading
  } = useDataStore();
  
  // Use Supabase providers for both dropdown and display
  const providersForDropdown = supabaseProviders;
  const providersForDisplay = supabaseProviders;
  
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        await Promise.all([
          loadEvents(),
          loadAssignments(),
          loadProviders(),
        ]);
        if (id) {
          await loadDocuments(id);
          await loadEventAvailability(id);
        }
      } catch (error) {
        console.error('Error loading event data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load event data',
          variant: 'destructive',
        });
      } finally {
        setIsLocalLoading(false);
      }
    }
    loadData();
  }, [id, loadEvents, loadAssignments, loadProviders, loadDocuments, toast]);

  // Load staff details when assignments are available
  useEffect(() => {
    if (id && assignments.length > 0) {
      const eventAssignments = assignments.filter((a) => a.event_id === id);
      eventAssignments.forEach((assignment) => {
        loadStaffDetails(assignment.id).catch((error) => {
          console.error(`Error loading staff details for assignment ${assignment.id}:`, error);
        });
      });
    }
  }, [id, assignments, loadStaffDetails]);

  // Availability map for this event
  const availabilityByProvider = availability.reduce<Record<string, 'available' | 'unavailable'>>((acc, item) => {
    if (item.event_id === id) {
      acc[item.provider_id] = item.status;
    }
    return acc;
  }, {});

  const handleSaveAttendance = async (assignmentId: string, attendance: {
    actual_managers: number;
    actual_supervisors: number;
    actual_sia: number;
    actual_stewards: number;
  }) => {
    try {
      await updateAssignment(assignmentId, attendance);
      await loadAssignments(); // Reload to get updated data
      toast({
        title: 'Attendance Saved',
        description: 'Attendance data has been saved successfully.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance',
        variant: 'destructive',
      });
    }
  };

  const handleEditEvent = async () => {
    if (!event) return;
    
    try {
      // Validate form
      if (!editFormData.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Event name is required',
          variant: 'destructive',
        });
        return;
      }
      
      if (!editFormData.location.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Location is required',
          variant: 'destructive',
        });
        return;
      }

      const updatedEvent = await updateEvent(id, {
        name: editFormData.name.trim(),
        location: editFormData.location.trim(),
        date: editFormData.date,
        requirements: {
          managers: parseInt(editFormData.managers) || 0,
          supervisors: parseInt(editFormData.supervisors) || 0,
          sia: parseInt(editFormData.sia) || 0,
          stewards: parseInt(editFormData.stewards) || 0,
        },
      });
      
      // Reload events to ensure UI is in sync
      await loadEvents();
      
      // Update the edit form data with the updated event
      setEditFormData({
        name: updatedEvent.name,
        location: updatedEvent.location,
        date: updatedEvent.date,
        managers: updatedEvent.requirements.managers.toString(),
        supervisors: updatedEvent.requirements.supervisors.toString(),
        sia: updatedEvent.requirements.sia.toString(),
        stewards: updatedEvent.requirements.stewards.toString(),
      });
      
      setIsEditDialogOpen(false);
      toast({
        title: 'Event Updated',
        description: 'Event details have been updated successfully.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
    }
  };


  const handleDeleteEvent = async () => {
    const currentEvent = events.find((e) => e.id === id);
    if (!currentEvent) return;
    
    try {
      await deleteEvent(id);
      toast({
        title: 'Event Deleted',
        description: `${currentEvent.name} has been deleted.`,
        variant: 'default',
      });
      router.push('/admin/events');
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditAssignmentData({
      managers: assignment.assigned_managers.toString(),
      supervisors: assignment.assigned_supervisors.toString(),
      sia: assignment.assigned_sia.toString(),
      stewards: assignment.assigned_stewards.toString(),
    });
    setIsEditAssignmentDialogOpen(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedAssignment) return;
    try {
      await updateAssignment(selectedAssignment.id, {
        assigned_managers: parseInt(editAssignmentData.managers) || 0,
        assigned_supervisors: parseInt(editAssignmentData.supervisors) || 0,
        assigned_sia: parseInt(editAssignmentData.sia) || 0,
        assigned_stewards: parseInt(editAssignmentData.stewards) || 0,
      });
      await loadAssignments(); // Reload to get updated data
      setIsEditAssignmentDialogOpen(false);
      setSelectedAssignment(null);
      toast({
        title: 'Assignment Updated',
        description: 'Assignment has been updated successfully.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update assignment',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const assignment = assignments.find((a) => a.id === assignmentId);
      const provider = assignment ? providersForDisplay.find((p) => p.id === assignment.provider_id) : null;
      await deleteAssignment(assignmentId);
      await loadAssignments(); // Reload to get updated data
      setIsDeleteAssignmentDialogOpen(false);
      toast({
        title: 'Assignment Deleted',
        description: `Assignment for ${provider?.company_name || 'provider'} has been deleted.`,
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete assignment',
        variant: 'destructive',
      });
    }
  };

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditAssignmentDialogOpen, setIsEditAssignmentDialogOpen] = useState(false);
  const [isDeleteAssignmentDialogOpen, setIsDeleteAssignmentDialogOpen] = useState(false);
  const [isConfirmTimesheetsDialogOpen, setIsConfirmTimesheetsDialogOpen] = useState(false);
  const [isSendTimesDialogOpen, setIsSendTimesDialogOpen] = useState(false);
  const [isViewStaffDetailsDialogOpen, setIsViewStaffDetailsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [editAssignmentData, setEditAssignmentData] = useState({
    managers: '0',
    supervisors: '0',
    sia: '0',
    stewards: '0',
  });
  const [staffTimesShifts, setStaffTimesShifts] = useState<Array<{
    shift_number: number;
    roles: Array<{
      role_type: 'managers' | 'supervisors' | 'sia' | 'stewards' | '';
      staff_count: string;
      start_time: string;
      end_time: string;
    }>;
  }>>([{ shift_number: 1, roles: [{ role_type: '', staff_count: '', start_time: '', end_time: '' }] }]);
  const [newAssignment, setNewAssignment] = useState({
    providerId: '',
    managers: '0',
    supervisors: '0',
    sia: '0',
    stewards: '0',
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    date: '',
    managers: '0',
    supervisors: '0',
    sia: '0',
    stewards: '0',
  });

  // Find event - will be undefined until data loads
  const event = events.find((e) => e.id === id);
  
  useEffect(() => {
    if (event) {
      setEditFormData({
        name: event.name,
        location: event.location,
        date: event.date,
        managers: event.requirements.managers.toString(),
        supervisors: event.requirements.supervisors.toString(),
        sia: event.requirements.sia.toString(),
        stewards: event.requirements.stewards.toString(),
      });
    }
  }, [event]);

  if (isLocalLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading event...</p>
          </div>
        </div>
      </div>
    );
  }

  const eventAssignments = assignments.filter((a) => a.event_id === id);
  const documents = getDocumentsByEvent(id);
  
  if (!event) {
    return (
      <div className="space-y-6">
        <p>Event not found</p>
        <Link href="/admin/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  const handleCreateAssignment = async () => {
    if (!newAssignment.providerId || isSubmittingAssignment) return;

    try {
      setIsSubmittingAssignment(true);
      const provider = providersForDropdown.find((p) => p.id === newAssignment.providerId);
      if (!provider) {
        toast({
          title: 'Error',
          description: 'Provider not found',
          variant: 'destructive',
        });
        return;
      }

      // If using Supabase and provider ID is not a UUID (mock provider), 
      // we need to find the provider in Supabase by company name and map to UUID
      let providerId = newAssignment.providerId;
      const isMockProviderId = providerId.startsWith('provider-');
      
      if (isMockProviderId && process.env.NEXT_PUBLIC_USE_SUPABASE === 'true') {
        // Reload providers to ensure we have the latest from Supabase
        await loadProviders();
        // Get fresh providers from store
        const store = useDataStore.getState();
        const supabaseProvider = store.providers.find((p) => p.company_name === provider.company_name);
        
        if (!supabaseProvider) {
          toast({
            title: 'Error',
            description: `Provider "${provider.company_name}" not found in Supabase. To create assignments, you need to either: 1) Create the provider through the Providers page, or 2) Run the create_all_mock_providers() function in Supabase SQL editor after creating users in auth.users.`,
            variant: 'destructive',
          });
          return;
        }
        providerId = supabaseProvider.id;
      }

      // Warn if provider marked unavailable
      if (availabilityByProvider[providerId] === 'unavailable') {
        toast({
          title: 'Provider marked unavailable',
          description: 'This provider has marked themselves as unavailable for this event.',
          variant: 'destructive',
        });
      }

      await createAssignment({
        event_id: id,
        provider_id: providerId,
        assigned_managers: parseInt(newAssignment.managers) || 0,
        assigned_supervisors: parseInt(newAssignment.supervisors) || 0,
        assigned_sia: parseInt(newAssignment.sia) || 0,
        assigned_stewards: parseInt(newAssignment.stewards) || 0,
        status: 'pending',
        details_requested: false,
        times_sent: false,
        timesheets_confirmed: false,
      });

      await loadAssignments(); // Reload to get updated data

      setNewAssignment({
        providerId: '',
        managers: '0',
        supervisors: '0',
        sia: '0',
        stewards: '0',
      });
      setIsAssignDialogOpen(false);

      toast({
        title: 'Assignment Created',
        description: `Assignment created for ${provider?.company_name || 'provider'}.`,
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create assignment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleConfirmTimesheets = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsConfirmTimesheetsDialogOpen(true);
  };

  const handleSendTimes = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    
    // Check if times have already been sent - if so, load existing data
    if (assignment.times_sent) {
      try {
        // Load existing staff times from the store
        await loadStaffTimes(assignment.id);
        const existingTimes = getStaffTimesByAssignment(assignment.id);
        
        if (existingTimes && existingTimes.length > 0) {
          // Group by shift_number
          const shiftsMap = new Map<number, typeof existingTimes>();
          existingTimes.forEach(time => {
            const shiftNum = time.shift_number;
            if (!shiftsMap.has(shiftNum)) {
              shiftsMap.set(shiftNum, []);
            }
            shiftsMap.get(shiftNum)!.push(time);
          });
          
          // Convert to form structure
          const shifts = Array.from(shiftsMap.entries())
            .sort(([a], [b]) => a - b) // Sort by shift number
            .map(([shiftNumber, times]) => ({
              shift_number: shiftNumber,
              roles: times.map(time => ({
                role_type: time.role_type,
                staff_count: time.staff_count.toString(),
                start_time: time.start_time.substring(0, 5), // Convert '09:00:00' to '09:00'
                end_time: time.end_time.substring(0, 5), // Convert '17:00:00' to '17:00'
              })),
            }));
          
          setStaffTimesShifts(shifts);
        } else {
          // No existing times, initialize with empty form
          setStaffTimesShifts([{ 
            shift_number: 1, 
            roles: [{ role_type: '', staff_count: '', start_time: '', end_time: '' }] 
          }]);
        }
      } catch (error) {
        console.error('Error loading existing staff times:', error);
        // On error, initialize with empty form
        setStaffTimesShifts([{ 
          shift_number: 1, 
          roles: [{ role_type: '', staff_count: '', start_time: '', end_time: '' }] 
        }]);
      }
    } else {
      // Times not sent yet, initialize with one shift and one empty role
      setStaffTimesShifts([{ 
        shift_number: 1, 
        roles: [{ role_type: '', staff_count: '', start_time: '', end_time: '' }] 
      }]);
    }
    
    setIsSendTimesDialogOpen(true);
  };

  const addShift = () => {
    const nextShiftNumber = staffTimesShifts.length + 1;
    setStaffTimesShifts([...staffTimesShifts, { 
      shift_number: nextShiftNumber, 
      roles: [{ role_type: '', staff_count: '', start_time: '', end_time: '' }] 
    }]);
  };

  const removeShift = (shiftIndex: number) => {
    if (staffTimesShifts.length > 1) {
      const updated = staffTimesShifts.filter((_, i) => i !== shiftIndex);
      // Renumber shifts
      updated.forEach((shift, i) => {
        shift.shift_number = i + 1;
      });
      setStaffTimesShifts(updated);
    }
  };

  const addRoleToShift = (shiftIndex: number) => {
    const updated = [...staffTimesShifts];
    updated[shiftIndex].roles.push({ role_type: '', staff_count: '', start_time: '', end_time: '' });
    setStaffTimesShifts(updated);
  };

  const removeRoleFromShift = (shiftIndex: number, roleIndex: number) => {
    const updated = [...staffTimesShifts];
    if (updated[shiftIndex].roles.length > 1) {
      updated[shiftIndex].roles = updated[shiftIndex].roles.filter((_, i) => i !== roleIndex);
      setStaffTimesShifts(updated);
    }
  };

  const updateRole = (shiftIndex: number, roleIndex: number, field: 'role_type' | 'staff_count' | 'start_time' | 'end_time', value: string) => {
    const updated = [...staffTimesShifts];
    updated[shiftIndex].roles[roleIndex] = { ...updated[shiftIndex].roles[roleIndex], [field]: value };
    setStaffTimesShifts(updated);
  };

  const handleSaveStaffTimes = async () => {
    if (!selectedAssignment) return;
    
    try {
      // Role assignments
      const roleAssignments = {
        managers: selectedAssignment.assigned_managers,
        supervisors: selectedAssignment.assigned_supervisors,
        sia: selectedAssignment.assigned_sia,
        stewards: selectedAssignment.assigned_stewards,
      };

      // Validate all shifts and roles
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
      const roleTotals: Record<string, number> = {
        managers: 0,
        supervisors: 0,
        sia: 0,
        stewards: 0,
      };
      
      for (let shiftIndex = 0; shiftIndex < staffTimesShifts.length; shiftIndex++) {
        const shift = staffTimesShifts[shiftIndex];
        
        for (let roleIndex = 0; roleIndex < shift.roles.length; roleIndex++) {
          const role = shift.roles[roleIndex];
          
          // Validate all fields are filled
          if (!role.role_type || !role.staff_count || !role.start_time || !role.end_time) {
            toast({
              title: 'Validation Error',
              description: `Please fill in all fields for Shift ${shift.shift_number}, Role ${roleIndex + 1}`,
              variant: 'destructive',
            });
            return;
          }
          
          // Validate time format
          if (!timeRegex.test(role.start_time) || !timeRegex.test(role.end_time)) {
            toast({
              title: 'Invalid Time Format',
              description: `Shift ${shift.shift_number}, ${role.role_type}: Please use 24-hour format (HH:MM), e.g., 09:00 or 17:00`,
              variant: 'destructive',
            });
            return;
          }
          
          // Accumulate role totals
          roleTotals[role.role_type] += parseInt(role.staff_count) || 0;
        }
      }

      // Validate each role doesn't exceed assigned
      for (const [roleType, total] of Object.entries(roleTotals)) {
        if (total > roleAssignments[roleType as keyof typeof roleAssignments]) {
          toast({
            title: 'Staff Count Exceeded',
            description: `Total ${roleType} across all shifts (${total}) cannot exceed assigned ${roleType} (${roleAssignments[roleType as keyof typeof roleAssignments]})`,
            variant: 'destructive',
          });
          return;
        }
      }

      const provider = providersForDisplay.find((p) => p.id === selectedAssignment.provider_id);
      const event = events.find((e) => e.id === selectedAssignment.event_id);

      // Delete existing staff times for this assignment
      await deleteStaffTimesByAssignment(selectedAssignment.id);

      // Create all role entries for all shifts
      const sentAt = new Date().toISOString();
      for (const shift of staffTimesShifts) {
        for (const role of shift.roles) {
          await createStaffTimes({
            assignment_id: selectedAssignment.id,
            role_type: role.role_type as 'managers' | 'supervisors' | 'sia' | 'stewards',
            staff_count: parseInt(role.staff_count) || 0,
            start_time: `${role.start_time}:00`,
            end_time: `${role.end_time}:00`,
            shift_number: shift.shift_number,
            sent_at: sentAt,
          });
        }
      }

      // Update assignment to mark times as sent
      await updateAssignment(selectedAssignment.id, { times_sent: true });

      // Create or update proforma invoice record immediately when times are sent
      try {
        // Load staff times to calculate amount (they were just saved above)
        const times = getStaffTimesByAssignment(selectedAssignment.id);
        
        // Calculate invoice amount (we'll use default rates since we don't have provider agreement here)
        // For admin-created proformas, we use default rates
        let invoiceAmount = 0;
        if (times && times.length > 0) {
          // Calculate from actual times
          const defaultRates = { sia: 16.00, stewards: 14.00, managers: 16.00, supervisors: 16.00 };
          times.forEach((time) => {
            const startTime = new Date(`2000-01-01T${time.start_time}`);
            let endTime = new Date(`2000-01-01T${time.end_time}`);
            if (endTime < startTime) {
              endTime.setDate(endTime.getDate() + 1);
            }
            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const rate = defaultRates[time.role_type as keyof typeof defaultRates] || 14.00;
            invoiceAmount += time.staff_count * hours * rate;
          });
        } else {
          // Calculate from assigned staff with default 8 hours
          const roles = [
            { type: 'managers', count: selectedAssignment.assigned_managers, rate: 16.00 },
            { type: 'supervisors', count: selectedAssignment.assigned_supervisors, rate: 16.00 },
            { type: 'sia', count: selectedAssignment.assigned_sia, rate: 16.00 },
            { type: 'stewards', count: selectedAssignment.assigned_stewards, rate: 14.00 },
          ];
          roles.forEach((role) => {
            if (role.count > 0) {
              invoiceAmount += role.count * 8 * role.rate;
            }
          });
        }
        // Add VAT (20%)
        invoiceAmount = invoiceAmount * 1.2;

        // Reload invoices first to check if proforma already exists
        await loadInvoices();
        const existingProforma = invoices.find(
          (inv) => 
            inv.event_id === selectedAssignment.event_id &&
            inv.provider_id === selectedAssignment.provider_id &&
            inv.status === 'proforma'
        );

        if (existingProforma) {
          // Update existing proforma - we could update the amount here if needed
          await updateInvoiceStatus(existingProforma.id, 'proforma');
          await loadInvoices(); // Reload to show updated proforma
          toast({
            title: 'Proforma Updated',
            description: 'Proforma invoice has been updated and is now visible in the Invoices page.',
            variant: 'success',
          });
        } else {
          // Create new proforma invoice (file_path can be null for proformas since they're generated on-demand)
          // If using mock auth, pass admin email to use RPC function that bypasses RLS
          const isMockAuth = user?.id?.startsWith('user-') || user?.id?.startsWith('admin-');
          const adminEmail = isMockAuth ? user?.email : undefined;
          
          try {
            const newProforma = await uploadInvoice({
              event_id: selectedAssignment.event_id,
              provider_id: selectedAssignment.provider_id,
              file_path: null, // Proformas don't have uploaded files
              amount: invoiceAmount,
              status: 'proforma',
            }, adminEmail);
            console.log('Proforma created successfully:', newProforma.id);
            
            // Reload invoices to show the new proforma (uploadInvoice already adds to store, but reload ensures consistency)
            await loadInvoices();
            
            toast({
              title: 'Proforma Created',
              description: 'Proforma invoice has been created and is now visible in the Invoices page.',
              variant: 'success',
            });
          } catch (createError: any) {
            // If creation fails, log detailed error and rethrow so outer catch handles it
            console.error('Failed to create proforma invoice:', createError);
            throw createError;
          }
        }
      } catch (invoiceError: any) {
        // Log but don't fail - the times were saved successfully
        console.error('Failed to create/update proforma invoice, but times were saved:', invoiceError);
        console.error('Error details:', {
          message: invoiceError?.message,
          code: invoiceError?.code,
          details: invoiceError?.details,
          hint: invoiceError?.hint,
        });
        toast({
          title: 'Warning',
          description: `Times were saved, but proforma invoice could not be created/updated: ${invoiceError?.message || invoiceError?.code || 'Unknown error'}. Check console for details.`,
          variant: 'default',
        });
      }

      // Send notification to provider (non-blocking - don't fail if this errors)
      if (provider) {
        try {
          await addNotification({
            user_id: provider.user_id,
            type: 'assignment',
            title: 'Staff Times Received',
            message: `Staff times for event "${event?.name || 'the event'}" have been sent. Check the event details.`,
            read: false,
            link: `/provider/events/${selectedAssignment.event_id}`,
          });
        } catch (notifError) {
          // Log but don't fail - the times were saved successfully
          console.warn('Failed to send notification, but times were saved:', notifError);
        }
      }

      // Reload assignments to get updated times_sent status
      await loadAssignments();

      setIsSendTimesDialogOpen(false);
      setSelectedAssignment(null);
      setStaffTimesShifts([{ shift_number: 1, roles: [{ role_type: '', staff_count: '', start_time: '', end_time: '' }] }]);
      
      const totalRoles = staffTimesShifts.reduce((sum, shift) => sum + shift.roles.length, 0);
      toast({
        title: 'Times Sent',
        description: `${staffTimesShifts.length} shift${staffTimesShifts.length > 1 ? 's' : ''} with ${totalRoles} role assignment${totalRoles > 1 ? 's' : ''} have been sent to the provider.`,
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send staff times',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateInvoice = async () => {
    if (!event) return;

    try {
      // Load staff times for all accepted assignments
      const acceptedAssignments = eventAssignments.filter((a) => a.status === 'accepted');
      const staffTimesMap = new Map<string, any[]>();

      for (const assignment of acceptedAssignments) {
        await loadStaffTimes(assignment.id);
        const times = getStaffTimesByAssignment(assignment.id);
        if (times && times.length > 0) {
          staffTimesMap.set(assignment.id, times);
        }
      }

      // Generate the invoice PDF (admin generates actual invoices, not proforma)
      // Note: Admin invoices use default rates since we don't have provider-specific agreements here
      generateInvoicePDF(event, acceptedAssignments, providersForDisplay, staffTimesMap, false);

      toast({
        title: 'Invoice Generated',
        description: 'Invoice PDF has been generated and downloaded.',
        variant: 'success',
      });

      setIsInvoiceDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice',
        variant: 'destructive',
      });
    }
  };

  const handleRequestDetails = async (assignmentId: string) => {
    try {
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) {
        toast({
          title: 'Error',
          description: 'Assignment not found',
          variant: 'destructive',
        });
        return;
      }

      const provider = providersForDisplay.find((p) => p.id === assignment.provider_id);
      if (!provider) {
        toast({
          title: 'Error',
          description: 'Provider not found',
          variant: 'destructive',
        });
        return;
      }

      const event = events.find((e) => e.id === assignment.event_id);
      
      // Update assignment
      await updateAssignment(assignmentId, { details_requested: true });
      
      // Send notification to provider
      await addNotification({
        user_id: provider.user_id,
        type: 'assignment',
        title: 'PNC/SIA Details Requested',
        message: `Please upload PNC/SIA details for event "${event?.name || 'the event'}"`,
        read: false,
        link: `/provider/events/${assignment.event_id}`,
      });
      
      await loadAssignments(); // Reload to get updated data
      toast({
        title: 'Staff Details Requested',
        description: 'The provider has been notified to submit staff details.',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request staff details',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentUpload = async (file: File) => {
    try {
      await uploadDocument({
        event_id: id,
        provider_id: null,
        file_path: `briefings/${id}/${file.name}`,
        file_name: file.name,
        file_type: file.type,
      });
      await loadDocuments(id); // Reload documents
      toast({
        title: 'Document Uploaded',
        description: `${file.name} has been uploaded successfully.`,
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload document',
        variant: 'destructive',
      });
    }
  };

  const totalAssigned = eventAssignments.reduce(
    (acc, a) => ({
      managers: acc.managers + a.assigned_managers,
      supervisors: acc.supervisors + a.assigned_supervisors,
      sia: acc.sia + a.assigned_sia,
      stewards: acc.stewards + a.assigned_stewards,
    }),
    { managers: 0, supervisors: 0, sia: 0, stewards: 0 }
  );

  // Calculate remaining required staff
  const remaining = event ? {
    managers: Math.max(0, event.requirements.managers - totalAssigned.managers),
    supervisors: Math.max(0, event.requirements.supervisors - totalAssigned.supervisors),
    sia: Math.max(0, event.requirements.sia - totalAssigned.sia),
    stewards: Math.max(0, event.requirements.stewards - totalAssigned.stewards),
  } : { managers: 0, supervisors: 0, sia: 0, stewards: 0 };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/admin/events' },
          { label: event.name },
        ]}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <p className="text-gray-600 mt-1">
              {format(new Date(event.date), 'MMMM dd, yyyy')} • {event.location}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (event) {
                // Collect all staff details for this event
                const eventAssignments = assignments.filter((a) => a.event_id === event.id);
                const eventStaffDetails = eventAssignments.flatMap((a) => getStaffDetailsByAssignment(a.id));
                
                generatePncSiaPDF(event, eventAssignments, providersForDisplay, eventStaffDetails);
                toast({
                  title: 'PDF Generated',
                  description: 'PNC/SIA staff details PDF has been downloaded.',
                  variant: 'success',
                });
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Link href={`/reports/pnc/${id}`} target="_blank">
            <Button variant="outline">
              <FileBarChart className="h-4 w-4 mr-2" />
              View Report
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="print-keep"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Event</DialogTitle>
                <DialogDescription>Update event details and requirements</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Input
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={editFormData.location}
                      onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Staff Requirements</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Managers</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editFormData.managers}
                        onChange={(e) => setEditFormData({ ...editFormData, managers: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supervisors</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editFormData.supervisors}
                        onChange={(e) => setEditFormData({ ...editFormData, supervisors: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SIA Licensed</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editFormData.sia}
                        onChange={(e) => setEditFormData({ ...editFormData, sia: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stewards</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editFormData.stewards}
                        onChange={(e) => setEditFormData({ ...editFormData, stewards: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditEvent}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Event
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the event
                  <strong> "{event.name}"</strong> and all associated assignments, documents, and invoices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Event
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Staff Requirements</CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Compare the total staff required for this event with what has been assigned to providers</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <CardDescription>Required vs Assigned</CardDescription>
                </div>
                <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Provider to Event</DialogTitle>
                      <DialogDescription>
                        Allocate staff numbers to a provider for this event
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Provider</Label>
                        <Select
                          value={newAssignment.providerId}
                          onValueChange={(value) =>
                            setNewAssignment({ ...newAssignment, providerId: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a provider" />
                          </SelectTrigger>
                          <SelectContent className="!z-[110]">
                            {providersForDropdown && providersForDropdown.length > 0 ? (
                              providersForDropdown.map((provider) => (
                                <SelectItem key={provider.id} value={provider.id}>
                                  <div className="flex items-center justify-between w-full gap-2">
                                    <span>{provider.company_name}</span>
                                    {availabilityByProvider[provider.id] === 'available' && (
                                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-transparent">
                                        Available
                                      </Badge>
                                    )}
                                    {availabilityByProvider[provider.id] === 'unavailable' && (
                                      <Badge variant="secondary" className="bg-red-100 text-red-700 border-transparent">
                                        Unavailable
                                      </Badge>
                                    )}
                                    {availabilityByProvider[provider.id] === undefined && (
                                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-transparent">
                                        No response
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-providers" disabled>
                                No providers available
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {event?.requirements.managers > 0 && (
                          <div className="space-y-2">
                            <Label>
                              Managers 
                              {remaining.managers > 0 && (
                                <span className="text-muted-foreground text-xs font-normal ml-1">
                                  ({remaining.managers} remaining)
                                </span>
                              )}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={remaining.managers}
                              value={newAssignment.managers}
                              onChange={(e) =>
                                setNewAssignment({ ...newAssignment, managers: e.target.value })
                              }
                            />
                          </div>
                        )}
                        {event?.requirements.supervisors > 0 && (
                          <div className="space-y-2">
                            <Label>
                              Supervisors 
                              {remaining.supervisors > 0 && (
                                <span className="text-muted-foreground text-xs font-normal ml-1">
                                  ({remaining.supervisors} remaining)
                                </span>
                              )}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={remaining.supervisors}
                              value={newAssignment.supervisors}
                              onChange={(e) =>
                                setNewAssignment({ ...newAssignment, supervisors: e.target.value })
                              }
                            />
                          </div>
                        )}
                        {event?.requirements.sia > 0 && (
                          <div className="space-y-2">
                            <Label>
                              SIA Licensed 
                              {remaining.sia > 0 && (
                                <span className="text-muted-foreground text-xs font-normal ml-1">
                                  ({remaining.sia} remaining)
                                </span>
                              )}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={remaining.sia}
                              value={newAssignment.sia}
                              onChange={(e) =>
                                setNewAssignment({ ...newAssignment, sia: e.target.value })
                              }
                            />
                          </div>
                        )}
                        {event?.requirements.stewards > 0 && (
                          <div className="space-y-2">
                            <Label>
                              Stewards 
                              {remaining.stewards > 0 && (
                                <span className="text-muted-foreground text-xs font-normal ml-1">
                                  ({remaining.stewards} remaining)
                                </span>
                              )}
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              max={remaining.stewards}
                              value={newAssignment.stewards}
                              onChange={(e) =>
                                setNewAssignment({ ...newAssignment, stewards: e.target.value })
                              }
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateAssignment}
                        disabled={isSubmittingAssignment}
                      >
                        {isSubmittingAssignment ? 'Creating...' : 'Create Assignment'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {event.requirements.managers > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{totalAssigned.managers}/{event.requirements.managers}</div>
                    <div className="text-sm text-gray-600">Managers</div>
                  </div>
                )}
                {event.requirements.supervisors > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {totalAssigned.supervisors}/{event.requirements.supervisors}
                    </div>
                    <div className="text-sm text-gray-600">Supervisors</div>
                  </div>
                )}
                {event.requirements.sia > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{totalAssigned.sia}/{event.requirements.sia}</div>
                    <div className="text-sm text-gray-600">SIA Licensed</div>
                  </div>
                )}
                {event.requirements.stewards > 0 && (
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">
                      {totalAssigned.stewards}/{event.requirements.stewards}
                    </div>
                    <div className="text-sm text-gray-600">Stewards</div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Provider Assignments</h3>
                {eventAssignments.length > 0 ? (
                  eventAssignments.map((assignment) => {
                    // Use Supabase providers for display (they have the correct UUIDs)
                    const provider = providersForDisplay.find((p) => p.id === assignment.provider_id);
                    if (!provider) {
                      console.warn(`Provider not found for assignment ${assignment.id} with provider_id ${assignment.provider_id}`);
                      return null;
                    }
                    const availabilityStatus =
                      availabilityByProvider[provider.id] ??
                      (assignment.status === 'accepted' ? 'available' : undefined);
                    const staffDetails = getStaffDetailsByAssignment(assignment.id);
                    const hasStaffDetailsUploaded = staffDetails.length > 0;
                    return (
                      <AssignmentRow
                        key={assignment.id}
                        assignment={assignment}
                        provider={provider}
                        availabilityStatus={availabilityStatus}
                        eventDate={event?.date}
                        hasStaffDetailsUploaded={hasStaffDetailsUploaded}
                        onRequestDetails={handleRequestDetails}
                        onViewDetails={(assignmentId) => {
                          // Open dialog to view staff details
                          const assignment = assignments.find((a) => a.id === assignmentId);
                          if (assignment) {
                            setSelectedAssignment(assignment);
                            setIsViewStaffDetailsDialogOpen(true);
                          }
                        }}
                        onSendTimes={handleSendTimes}
                        onConfirmTimesheets={handleConfirmTimesheets}
                        onEdit={handleEditAssignment}
                        onDelete={(id) => {
                          setSelectedAssignment(assignment);
                          setIsDeleteAssignmentDialogOpen(true);
                        }}
                      />
                    );
                  })
                ) : (
                  <EmptyState
                    icon={Calendar}
                    title="No Assignments Yet"
                    description="Start by assigning a provider to this event. Click the 'Assign Provider' button above to get started."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Staff</CardTitle>
              <CardDescription>Staff details provided by all assigned providers</CardDescription>
            </CardHeader>
            <CardContent>
              {eventAssignments.length > 0 ? (
                <div className="space-y-6">
                  {eventAssignments.map((assignment) => {
                    const provider = providersForDisplay.find((p) => p.id === assignment.provider_id);
                    if (!provider) return null;
                    
                    const staffDetails = getStaffDetailsByAssignment(assignment.id);
                    
                    return (
                      <div key={assignment.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                          <h3 className="font-medium">{provider.company_name}</h3>
                          <div className="text-sm text-gray-500">
                            {staffDetails.length} staff members
                          </div>
                        </div>
                        {staffDetails.length > 0 ? (
                          <table className="w-full text-sm">
                            <thead className="bg-white border-b">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">Role</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">SIA Number</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500">PNC Info</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {staffDetails.map((staff) => (
                                <tr key={staff.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2">{staff.staff_name}</td>
                                  <td className="px-4 py-2">
                                    {staff.role ? (
                                      <Badge variant="outline" className="font-normal">
                                        {staff.role}
                                      </Badge>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 font-mono text-xs">{staff.sia_number || '-'}</td>
                                  <td className="px-4 py-2 text-gray-500">{staff.pnc_info || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-8 text-center text-gray-500">
                            No staff details uploaded yet.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No Assignments"
                  description="Assign providers to this event to see staff details."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Event briefing documents and files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                onFileSelect={handleDocumentUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                maxSize={10}
                label="Upload Document"
                description="Upload briefing documents, maps, or other event files"
              />
              {documents.length > 0 ? (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Uploaded Documents</h4>
                  <div className="space-y-2">
                    {documents.map((doc) => {
                      const comments = getDocumentComments(doc.id);
                      return (
                        <div
                          key={doc.id}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium">{doc.file_name}</p>
                                <p className="text-sm text-gray-600">{doc.file_type}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              Download
                            </Button>
                          </div>
                          <DocumentComments
                            documentId={doc.id}
                            comments={comments}
                            onAddComment={async (docId, content) => {
                              if (currentUser) {
                                try {
                                  await addDocumentComment({
                                    document_id: docId,
                                    user_id: currentUser.id,
                                    content,
                                  });
                                  // Reload documents to get updated comments
                                  await loadDocuments(id);
                                  toast({
                                    title: 'Comment Added',
                                    description: 'Your comment has been added to the document.',
                                    variant: 'success',
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: 'Error',
                                    description: error.message || 'Failed to add comment',
                                    variant: 'destructive',
                                  });
                                }
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <EmptyState
                    icon={FileText}
                    title="No Documents Yet"
                    description="Upload briefing documents, maps, or other event files using the upload area above."
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-4">
          {eventAssignments.filter((a) => a.status === 'accepted' && a.actual_managers !== null).length > 0 && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <AttendanceChart assignments={eventAssignments} providers={providersForDisplay} />
                <AttendanceRateChart assignments={eventAssignments} providers={providersForDisplay} />
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Trend Over Time</CardTitle>
                  <CardDescription>Historical attendance data for this event's assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <AttendanceTrendChart assignments={eventAssignments} events={events} days={30} />
                </CardContent>
              </Card>
            </>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
              <CardDescription>Attendance and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {eventAssignments.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {eventAssignments.map((assignment) => {
                  const provider = providersForDisplay.find((p) => p.id === assignment.provider_id);
                  if (!provider) return null;

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

                  const attendanceRate =
                    assignment.status === 'accepted' && totalAssigned > 0
                      ? ((totalActual / totalAssigned) * 100).toFixed(1)
                      : 'N/A';

                  return (
                    <div key={assignment.id} className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">{provider.company_name}</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Assigned:</span>
                            <span className="ml-2 font-medium">{totalAssigned}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Actual:</span>
                            <span className="ml-2 font-medium">{totalActual || 'Not recorded'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Attendance:</span>
                            <span
                              className={`ml-2 font-medium ${
                                attendanceRate !== 'N/A' && parseFloat(attendanceRate) >= 95
                                  ? 'text-green-600'
                                  : attendanceRate !== 'N/A' && parseFloat(attendanceRate) >= 80
                                  ? 'text-yellow-600'
                                  : attendanceRate !== 'N/A'
                                  ? 'text-red-600'
                                  : ''
                              }`}
                            >
                              {attendanceRate}%
                            </span>
                          </div>
                        </div>
                      </div>
                      {assignment.status === 'accepted' && (
                        <AttendanceInput
                          assignment={assignment}
                          providerName={provider.company_name}
                          onSave={handleSaveAttendance}
                        />
                      )}
                    </div>
                  );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No KPIs Available"
                  description="KPIs will appear here once assignments are accepted and attendance data is recorded."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Invoice</CardTitle>
              <CardDescription>Create an invoice for this event with staff times and costs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setIsInvoiceDialogOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
            <DialogDescription>
              Review and generate invoice for this event
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {event && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Event Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Event Name:</span>
                      <span className="ml-2 font-medium">{event.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2 font-medium">{format(new Date(event.date), 'MMMM dd, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Location:</span>
                      <span className="ml-2 font-medium">{event.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Staff Breakdown</h3>
                  {eventAssignments
                    .filter((a) => a.status === 'accepted')
                    .map((assignment) => {
                      const provider = providersForDisplay.find((p) => p.id === assignment.provider_id);
                      if (!provider) return null;

                      return (
                        <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                          <div className="font-medium">{provider.company_name}</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Managers: {assignment.assigned_managers}</div>
                            <div>Supervisors: {assignment.assigned_supervisors}</div>
                            <div>SIA Licensed: {assignment.assigned_sia}</div>
                            <div>Stewards: {assignment.assigned_stewards}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateInvoice}>
              <Download className="h-4 w-4 mr-2" />
              Generate Invoice PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditAssignmentDialogOpen} onOpenChange={setIsEditAssignmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>Update staff numbers for this assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Managers</Label>
                <Input
                  type="number"
                  min="0"
                  value={editAssignmentData.managers}
                  onChange={(e) =>
                    setEditAssignmentData({ ...editAssignmentData, managers: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Supervisors</Label>
                <Input
                  type="number"
                  min="0"
                  value={editAssignmentData.supervisors}
                  onChange={(e) =>
                    setEditAssignmentData({ ...editAssignmentData, supervisors: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>SIA Licensed</Label>
                <Input
                  type="number"
                  min="0"
                  value={editAssignmentData.sia}
                  onChange={(e) =>
                    setEditAssignmentData({ ...editAssignmentData, sia: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Stewards</Label>
                <Input
                  type="number"
                  min="0"
                  value={editAssignmentData.stewards}
                  onChange={(e) =>
                    setEditAssignmentData({ ...editAssignmentData, stewards: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditAssignmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Dialog */}
      <AlertDialog open={isDeleteAssignmentDialogOpen} onOpenChange={setIsDeleteAssignmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the assignment and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedAssignment && handleDeleteAssignment(selectedAssignment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Assignment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Times Dialog */}
      <Dialog open={isSendTimesDialogOpen} onOpenChange={setIsSendTimesDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment?.times_sent ? 'Update Staff Times' : 'Send Staff Times'}
            </DialogTitle>
            <DialogDescription>
              {selectedAssignment?.times_sent 
                ? "Update shifts with role-based staff counts and times (24-hour format) for this provider's assignment"
                : "Set shifts with role-based staff counts and times (24-hour format) for this provider's assignment"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAssignment && (
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                <p className="font-medium">Assigned Staff:</p>
                <div className="grid grid-cols-4 gap-2">
                  <span>Managers: {selectedAssignment.assigned_managers}</span>
                  <span>Supervisors: {selectedAssignment.assigned_supervisors}</span>
                  <span>SIA: {selectedAssignment.assigned_sia}</span>
                  <span>Stewards: {selectedAssignment.assigned_stewards}</span>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={addShift}>
                + Add Shift
              </Button>
            </div>
            
            {staffTimesShifts.map((shift, shiftIndex) => (
              <div key={shiftIndex} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Shift {shift.shift_number}</h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addRoleToShift(shiftIndex)}
                    >
                      + Add Role
                    </Button>
                    {staffTimesShifts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShift(shiftIndex)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove Shift
                      </Button>
                    )}
                  </div>
                </div>
                
                {shift.roles.map((role, roleIndex) => (
                  <div key={roleIndex} className="bg-gray-50 p-3 rounded space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Role {roleIndex + 1}</span>
                      {shift.roles.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRoleFromShift(shiftIndex, roleIndex)}
                          className="text-red-600 hover:text-red-700 text-xs"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Role Type</Label>
                        <Select
                          value={role.role_type}
                          onValueChange={(value) => updateRole(shiftIndex, roleIndex, 'role_type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedAssignment && selectedAssignment.assigned_managers > 0 && (
                              <SelectItem value="managers">Managers</SelectItem>
                            )}
                            {selectedAssignment && selectedAssignment.assigned_supervisors > 0 && (
                              <SelectItem value="supervisors">Supervisors</SelectItem>
                            )}
                            {selectedAssignment && selectedAssignment.assigned_sia > 0 && (
                              <SelectItem value="sia">SIA Licensed</SelectItem>
                            )}
                            {selectedAssignment && selectedAssignment.assigned_stewards > 0 && (
                              <SelectItem value="stewards">Stewards</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Staff Count</Label>
                        <Input
                          type="number"
                          min="1"
                          value={role.staff_count}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (role.role_type && selectedAssignment) {
                              const roleAssignments = {
                                managers: selectedAssignment.assigned_managers,
                                supervisors: selectedAssignment.assigned_supervisors,
                                sia: selectedAssignment.assigned_sia,
                                stewards: selectedAssignment.assigned_stewards,
                              };
                              const maxForRole = roleAssignments[role.role_type as keyof typeof roleAssignments];
                              const otherRolesTotal = staffTimesShifts
                                .flatMap(s => s.roles)
                                .filter((r, i) => {
                                  const flatIndex = staffTimesShifts.slice(0, shiftIndex).reduce((sum, s) => sum + s.roles.length, 0) + roleIndex;
                                  return i !== flatIndex && r.role_type === role.role_type;
                                })
                                .reduce((sum, r) => sum + (parseInt(r.staff_count) || 0), 0);
                              const maxForThisRole = maxForRole - otherRolesTotal;
                              if (!value || parseInt(value) <= maxForThisRole) {
                                updateRole(shiftIndex, roleIndex, 'staff_count', value);
                              }
                            } else {
                              updateRole(shiftIndex, roleIndex, 'staff_count', value);
                            }
                          }}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Time (24hr)</Label>
                        <Input
                          type="text"
                          value={role.start_time}
                          onChange={(e) => updateRole(shiftIndex, roleIndex, 'start_time', e.target.value)}
                          placeholder="09:00"
                          pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
                        />
                        <p className="text-xs text-gray-500">HH:MM</p>
                      </div>
                      <div className="space-y-2">
                        <Label>End Time (24hr)</Label>
                        <Input
                          type="text"
                          value={role.end_time}
                          onChange={(e) => updateRole(shiftIndex, roleIndex, 'end_time', e.target.value)}
                          placeholder="17:00"
                          pattern="^([0-1][0-9]|2[0-3]):[0-5][0-9]$"
                        />
                        <p className="text-xs text-gray-500">HH:MM</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSendTimesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStaffTimes}>
              {selectedAssignment?.times_sent ? 'Update Times' : 'Send Times'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedAssignment && (
        <ConfirmTimesheetsDialog
          assignment={selectedAssignment}
          provider={providersForDisplay.find((p) => p.id === selectedAssignment.provider_id)!}
          open={isConfirmTimesheetsDialogOpen}
          onOpenChange={setIsConfirmTimesheetsDialogOpen}
        />
      )}

      {/* View Staff Details Dialog */}
      <Dialog open={isViewStaffDetailsDialogOpen} onOpenChange={setIsViewStaffDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PNC/SIA Staff Details</DialogTitle>
            <DialogDescription>
              {selectedAssignment && providersForDisplay.find((p) => p.id === selectedAssignment.provider_id)?.company_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAssignment ? (
              (() => {
                const staffDetails = getStaffDetailsByAssignment(selectedAssignment.id);
                return staffDetails.length > 0 ? (
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">SIA Number</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">PNC Info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffDetails.map((detail) => (
                          <tr key={detail.id} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3">{detail.staff_name}</td>
                            <td className="px-4 py-3">{detail.role || '-'}</td>
                            <td className="px-4 py-3">{detail.sia_number || '-'}</td>
                            <td className="px-4 py-3">{detail.pnc_info || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No staff details have been uploaded yet.</p>
                  </div>
                );
              })()
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewStaffDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

