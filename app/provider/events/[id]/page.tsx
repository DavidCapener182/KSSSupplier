'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { useMockDataStore } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import Link from 'next/link';
import { ArrowLeft, Check, X, Upload, FileText, Download } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdf-export';
import { generateContractorAgreement } from '@/lib/agreement-template';
import { generateInvoiceHTML } from '@/lib/invoice-html';
import { useToast } from '@/components/ui/use-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { StaffBulkUpload } from '@/components/provider/StaffBulkUpload';
import { StaffBriefing } from '@/components/provider/StaffBriefing';
import type { StaffDetail } from '@/lib/types';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Helper function to extract body content and styles from full HTML document
function extractBodyContent(fullHTML: string): string {
  // Extract styles from head
  const styleMatch = fullHTML.match(/<style>([\s\S]*?)<\/style>/);
  const styles = styleMatch ? styleMatch[1] : '';
  
  // Extract body content
  const bodyMatch = fullHTML.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const bodyContent = bodyMatch ? bodyMatch[1] : fullHTML;
  
  // Return combined content with styles in a style tag and body content
  return `
    <style>
      ${styles}
      body {
        padding: 20px !important;
        margin: 0 !important;
      }
    </style>
    ${bodyContent}
  `;
}

export default function ProviderEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    events,
    assignments,
    providers,
    acceptAssignment,
    declineAssignment,
    updateAssignment,
    getDocumentsByEvent,
    getStaffDetailsByAssignment,
    addStaffDetail,
    uploadInvoice,
    getInvoicesByProvider,
    getStaffTimesByAssignment,
    loadStaffTimes,
    loadEvents,
    loadAssignments,
    loadProviders,
    loadDocuments,
    loadInvoices,
    getOnboardingDocuments,
    loadOnboardingDocuments,
  } = useDataStore();
  
  // All hooks must be called before any conditional returns
  const [staffDetailForm, setStaffDetailForm] = useState({
    staff_name: '',
    role: '',
    sia_number: '',
    pnc_info: '',
  });
  const [showPncDialog, setShowPncDialog] = useState(false);
  const [proformaHTML, setProformaHTML] = useState<string | null>(null);
  const proformaGeneratedRef = useRef<string | false>(false);

  useEffect(() => {
    loadEvents();
    loadAssignments();
    loadProviders();
    loadDocuments(id);
    loadInvoices();
  }, [id, loadEvents, loadAssignments, loadProviders, loadDocuments, loadInvoices]);

  const handleBulkStaffUpload = (staffList: Omit<StaffDetail, 'id'>[]) => {
    staffList.forEach((staff) => {
      addStaffDetail(staff);
    });
  };

  const event = events.find((e) => e.id === id);
  
  // Check if using mock auth (user ID starts with 'user-' or 'admin-')
  const isMockAuth = user?.id?.startsWith('user-') || user?.id?.startsWith('admin-');
  const { providers: mockProviders } = useMockDataStore(); // Get mock providers for mock auth lookup
  
  const mockProvider = isMockAuth && user
    ? mockProviders.find((p) => p.user_id === user.id)
    : null;
    
  // If using mock auth, find the corresponding Supabase provider by company name/email
  const provider = isMockAuth && mockProvider
    ? providers.find((p) => 
        p.company_name === mockProvider.company_name || 
        p.contact_email === mockProvider.contact_email
      ) || mockProvider
    : providers.find((p) => p.user_id === user?.id);
    
  // For assignments, use the Supabase provider ID if available (for UUID matching)
  const providerIdForAssignments = isMockAuth && mockProvider && provider && provider.id !== mockProvider.id
    ? provider.id
    : provider?.id;
    
  // Find assignment - this will update when assignments array changes
  const assignment = providerIdForAssignments
    ? assignments.find((a) => a.event_id === id && a.provider_id === providerIdForAssignments)
    : undefined;

  // Load staff times when assignment is available
  useEffect(() => {
    if (assignment) {
      loadStaffTimes(assignment.id).then(() => {
        // Force a re-render by updating a state if needed
        // The proforma effect will pick up the loaded times
      });
    }
  }, [assignment?.id, loadStaffTimes]);
  
  // Debug logging for assignment status
  useEffect(() => {
    if (assignment) {
      console.log('Assignment status:', assignment.status);
      console.log('Assignment ID:', assignment.id);
      console.log('Provider ID for assignments:', providerIdForAssignments);
    }
  }, [assignment, providerIdForAssignments]);

  const documents = getDocumentsByEvent(id, provider?.id);
  const staffDetails = assignment ? getStaffDetailsByAssignment(assignment.id) : [];
  const staffTimes = assignment ? getStaffTimesByAssignment(assignment.id) : [];
  const invoices = provider ? getInvoicesByProvider(provider.id) : [];
  const eventInvoice = invoices.find((inv) => inv.event_id === id);

  const isEventPassed = event ? new Date(event.date) < new Date() : false;

  // Show popup when details are requested and assignment is accepted
  useEffect(() => {
    if (assignment && assignment.status === 'accepted' && assignment.details_requested) {
      // Check if we've already shown this dialog (using sessionStorage)
      const dialogShownKey = `pnc-dialog-shown-${assignment.id}`;
      const hasShown = sessionStorage.getItem(dialogShownKey);
      if (!hasShown) {
        setShowPncDialog(true);
        sessionStorage.setItem(dialogShownKey, 'true');
      }
    }
  }, [assignment]);

  // Load and display proforma when assignment and staff times are available
  useEffect(() => {
    // Skip if conditions not met
    if (!event || !assignment || !provider || assignment.status !== 'accepted' || isEventPassed) {
      if (proformaHTML) {
        setProformaHTML(null);
      }
      proformaGeneratedRef.current = false;
      return;
    }

    let isMounted = true;
    let cancelled = false;
    
    const loadProforma = async () => {
      if (cancelled || !isMounted) return;

      try {
        // Load staff times for this assignment
        await loadStaffTimes(assignment.id);
        
        if (cancelled || !isMounted) return;
        
        const times = getStaffTimesByAssignment(assignment.id);
        
        if (cancelled || !isMounted) return;
        
        if (times && times.length > 0) {
          // Create a stable key based on assignment and staff times
          const timesKey = times.map(t => `${t.role_type}-${t.staff_count}-${t.start_time}-${t.end_time}-${t.shift_number}`).join('|');
          const key = `${assignment.id}-${timesKey}`;
          
          // Only generate once per unique combination - if we already have the HTML for this key, skip
          // But allow regeneration if proformaHTML is null (first load or after error)
          if (proformaGeneratedRef.current === key && proformaHTML) {
            return;
          }
          
          // Mark as generating to prevent duplicate runs
          proformaGeneratedRef.current = key;
          
          const staffTimesMap = new Map<string, any[]>();
          staffTimesMap.set(assignment.id, times);

          // Load onboarding documents to get agreement content for rates
          await loadOnboardingDocuments(provider.id);
          
          if (cancelled || !isMounted) return;
          
          const onboardingDocs = getOnboardingDocuments(provider.id);
          let agreementDoc = onboardingDocs.find(
            (doc) => doc.document_type === 'contractor_agreement'
          );
          
          // If agreement exists but content is empty or template placeholder, generate it
          let agreementContent = agreementDoc?.content;
          if (agreementDoc && (!agreementContent || agreementContent.length < 100)) {
            agreementContent = generateContractorAgreement({
              company_name: provider.company_name,
              address: provider.address || '',
              company_registration: provider.company_registration || '',
              contact_email: provider.contact_email,
              contact_phone: provider.contact_phone,
            });
          }

          if (cancelled || !isMounted) return;

          // Generate proforma HTML for display
          const html = generateInvoiceHTML(
            event,
            [assignment],
            [provider],
            staffTimesMap,
            true,
            agreementContent
          );
          
          if (isMounted && !cancelled) {
            setProformaHTML(html);
          }
        } else {
          // If no staff times, don't show proforma
          if (isMounted && !cancelled) {
            setProformaHTML(null);
            proformaGeneratedRef.current = '';
          }
        }
      } catch (error) {
        console.error('Error loading proforma:', error);
        if (isMounted && !cancelled) {
          setProformaHTML(null);
          proformaGeneratedRef.current = '';
        }
      }
    };

    loadProforma();
    
    return () => {
      cancelled = true;
      isMounted = false;
    };
  }, [event?.id, assignment?.id, assignment?.times_sent, provider?.id, assignment?.status, isEventPassed]);

  if (!event) {
    return (
      <div className="space-y-6">
        <p>Event not found</p>
        <Link href="/provider/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="space-y-6">
        <p>You are not assigned to this event</p>
        <Link href="/provider/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const handleAccept = async () => {
    if (!assignment) return;
    
    try {
      console.log('Accepting assignment:', assignment.id);
      console.log('Assignment object:', assignment);
      console.log('Provider ID for assignments:', providerIdForAssignments);
      console.log('Is mock auth:', isMockAuth);
      
      const updated = await acceptAssignment(assignment.id);
      console.log('Assignment accepted, updated:', updated);
      
      // Reload assignments to get updated status from Supabase
      await loadAssignments();
      
      toast({
        title: 'Assignment Accepted',
        description: 'You have successfully accepted this assignment.',
        variant: 'success',
      });
      
      // Small delay to ensure state updates, then refresh
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error('Error accepting assignment:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      toast({
        title: 'Error',
        description: error?.message || error?.details || 'Failed to accept assignment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDecline = async () => {
    if (assignment) {
      try {
        await declineAssignment(assignment.id);
        // Reload assignments to get updated status
        await loadAssignments();
        toast({
          title: 'Assignment Declined',
          description: 'You have declined this assignment.',
          variant: 'default',
        });
      } catch (error) {
        console.error('Error declining assignment:', error);
        toast({
          title: 'Error',
          description: 'Failed to decline assignment. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAddStaffDetail = () => {
    if (!assignment || !staffDetailForm.staff_name) return;

    addStaffDetail({
      assignment_id: assignment.id,
      staff_name: staffDetailForm.staff_name,
      role: (staffDetailForm.role as 'Manager' | 'Supervisor' | 'SIA' | 'Steward') || undefined,
      sia_number: staffDetailForm.sia_number || undefined,
      pnc_info: staffDetailForm.pnc_info || undefined,
    });

    setStaffDetailForm({
      staff_name: '',
      role: '',
      sia_number: '',
      pnc_info: '',
    });

    toast({
      title: 'Staff Member Added',
      description: `${staffDetailForm.staff_name} has been added to the staff list.`,
      variant: 'success',
    });
  };

  const handleInvoiceUpload = (file: File) => {
    if (provider) {
      uploadInvoice({
        event_id: id,
        provider_id: provider.id,
        file_path: `invoices/${id}/${provider.id}/${file.name}`,
        amount: null,
        status: 'pending',
      });
      toast({
        title: 'Invoice Uploaded',
        description: `Invoice ${file.name} has been uploaded successfully.`,
        variant: 'success',
      });
    }
  };

  const handleGenerateInvoice = async () => {
    if (!event || !assignment || !provider) return;

    try {
      // Load staff times for this assignment
      await loadStaffTimes(assignment.id);
      const times = getStaffTimesByAssignment(assignment.id);
      
      const staffTimesMap = new Map<string, any[]>();
      if (times && times.length > 0) {
        staffTimesMap.set(assignment.id, times);
      } else {
        // If no times, still allow download with empty map (will use defaults)
        staffTimesMap.set(assignment.id, []);
      }

      // Load onboarding documents to get agreement content for rates
      await loadOnboardingDocuments(provider.id);
      const onboardingDocs = getOnboardingDocuments(provider.id);
      let agreementDoc = onboardingDocs.find(
        (doc) => doc.document_type === 'contractor_agreement'
      );
      
      // If agreement exists but content is empty or template placeholder, generate it
      let agreementContent = agreementDoc?.content;
      if (agreementDoc && (!agreementContent || agreementContent.length < 100)) {
        agreementContent = generateContractorAgreement({
          company_name: provider.company_name,
          address: provider.address || '',
          company_registration: provider.company_registration || '',
          contact_email: provider.contact_email,
          contact_phone: provider.contact_phone,
        });
      }

      // Generate the proforma invoice PDF with only this provider's assignment
      const isProforma = !isEventPassed;
      generateInvoicePDF(event, [assignment], [provider], staffTimesMap, isProforma, agreementContent);

      toast({
        title: 'Invoice Generated',
        description: 'Invoice PDF has been generated and downloaded.',
        variant: 'success',
      });
    } catch (error: any) {
      console.error('Error generating invoice PDF:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate invoice PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* PNC Details Requested Dialog */}
      <Dialog open={showPncDialog} onOpenChange={setShowPncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PNC/SIA Details Required</DialogTitle>
            <DialogDescription>
              You can now upload PNC/SIA details for this event. Please navigate to the "Staff Details" tab to submit the required information.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowPncDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center space-x-4">
        <Link href="/provider/dashboard">
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

      {assignment.timesheets_confirmed && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Check className="h-5 w-5" />
              Timesheets Confirmed
            </CardTitle>
            <CardDescription className="text-green-700">
              Your timesheets have been confirmed by the admin. You can now submit your invoice for this event.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {assignment.status === 'pending' && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
            <CardDescription>Please accept or decline this assignment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Accept Assignment
              </Button>
              <Button onClick={handleDecline} variant="destructive" className="flex-1">
                <X className="h-4 w-4 mr-2" />
                Decline Assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Assignment Details</TabsTrigger>
          <TabsTrigger value="staff">Staff Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          {isEventPassed ? (
            <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
          ) : (
            <TabsTrigger value="proforma">Proforma</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Assignment</CardTitle>
              <CardDescription>Staff numbers you are providing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{assignment.assigned_managers}</div>
                  <div className="text-sm text-gray-600">Managers</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{assignment.assigned_supervisors}</div>
                  <div className="text-sm text-gray-600">Supervisors</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{assignment.assigned_sia}</div>
                  <div className="text-sm text-gray-600">SIA Licensed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{assignment.assigned_stewards}</div>
                  <div className="text-sm text-gray-600">Stewards</div>
                </div>
              </div>
              <div className="mt-4">
                <Badge
                  variant={
                    assignment.status === 'accepted'
                      ? 'success'
                      : assignment.status === 'declined'
                      ? 'destructive'
                      : 'warning'
                  }
                >
                  Status: {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </Badge>
                {assignment.timesheets_confirmed && (
                  <Badge variant="success" className="ml-2 bg-green-600 hover:bg-green-700">
                    Timesheets Confirmed
                  </Badge>
                )}
              </div>
              {staffTimes.length > 0 && (() => {
                // Group by shift number
                const shifts = staffTimes.reduce((acc, time) => {
                  if (!acc[time.shift_number]) {
                    acc[time.shift_number] = [];
                  }
                  acc[time.shift_number].push(time);
                  return acc;
                }, {} as Record<number, typeof staffTimes>);

                return (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold mb-3 text-blue-900">Staff Times</h4>
                    <div className="space-y-4">
                      {Object.entries(shifts).map(([shiftNum, roles]) => {
                        // Define role order: Manager, Supervisor, SIA, Stewards
                        const roleOrder = ['managers', 'supervisors', 'sia', 'stewards'];
                        const getRoleOrder = (roleType: string): number => {
                          const index = roleOrder.indexOf(roleType);
                          return index === -1 ? 999 : index;
                        };
                        
                        // Sort roles by predefined order
                        const sortedRoles = [...roles].sort((a, b) => 
                          getRoleOrder(a.role_type) - getRoleOrder(b.role_type)
                        );
                        
                        // Map role types to display names
                        const getRoleDisplayName = (roleType: string): string => {
                          const displayNames: Record<string, string> = {
                            'managers': 'Manager',
                            'supervisors': 'Supervisor',
                            'sia': 'SIA',
                            'stewards': 'Steward',
                          };
                          return displayNames[roleType] || roleType.charAt(0).toUpperCase() + roleType.slice(1);
                        };
                        
                        return (
                          <div key={shiftNum} className="bg-white rounded p-3 border border-blue-100">
                            <div className="font-medium text-blue-900 mb-3">Shift {shiftNum}</div>
                            <div className="space-y-2">
                              {sortedRoles.map((role) => (
                                <div key={role.id} className="grid grid-cols-4 gap-4 text-sm border-b pb-2 last:border-0">
                                  <div>
                                    <span className="text-blue-700 font-medium">{getRoleDisplayName(role.role_type)}:</span>
                                  </div>
                                  <div>
                                    <span className="text-blue-700">Count:</span>
                                    <span className="ml-2 font-medium text-blue-900">{role.staff_count}</span>
                                  </div>
                                  <div>
                                    <span className="text-blue-700">Start:</span>
                                    <span className="ml-2 font-medium text-blue-900">
                                      {role.start_time.substring(0, 5)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-blue-700">End:</span>
                                    <span className="ml-2 font-medium text-blue-900">
                                      {role.end_time.substring(0, 5)}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {staffTimes[0]?.sent_at && (
                      <p className="text-xs text-blue-600 mt-3">
                        Sent on: {format(new Date(staffTimes[0].sent_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {assignment && assignment.status === 'accepted' && (
            <StaffBriefing
              eventId={id}
              eventName={event?.name || ''}
              eventDate={event ? format(new Date(event.date), 'MMMM dd, yyyy') : ''}
              eventLocation={event?.location || ''}
            />
          )}
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Details (PNC/SIA)</CardTitle>
              <CardDescription>
                {assignment.details_requested
                  ? 'Please provide staff details for accreditation'
                  : 'Staff details not yet requested by admin'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignment.details_requested && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold">Add Staff Member</h4>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div className="space-y-2">
                        <Label>Staff Name</Label>
                        <Input
                          value={staffDetailForm.staff_name}
                          onChange={(e) =>
                            setStaffDetailForm({ ...staffDetailForm, staff_name: e.target.value })
                          }
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={staffDetailForm.role}
                          onValueChange={(value) =>
                            setStaffDetailForm({ ...staffDetailForm, role: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Supervisor">Supervisor</SelectItem>
                            <SelectItem value="SIA">SIA</SelectItem>
                            <SelectItem value="Steward">Steward</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>SIA Badge Number</Label>
                        <Input
                          value={staffDetailForm.sia_number}
                          onChange={(e) =>
                            setStaffDetailForm({ ...staffDetailForm, sia_number: e.target.value })
                          }
                          placeholder="SIA-12345"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PNC Info</Label>
                        <Input
                          value={staffDetailForm.pnc_info}
                          onChange={(e) =>
                            setStaffDetailForm({ ...staffDetailForm, pnc_info: e.target.value })
                          }
                          placeholder="PNC reference"
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddStaffDetail} disabled={!staffDetailForm.staff_name}>
                      Add Staff Member
                    </Button>
                  </div>

                  <StaffBulkUpload
                    assignmentId={assignment.id}
                    onUpload={handleBulkStaffUpload}
                  />

                  {staffDetails.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Submitted Staff List</h4>
                      <div className="border rounded-lg">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">SIA Number</th>
                              <th className="px-4 py-2 text-left text-sm font-medium">PNC Info</th>
                            </tr>
                          </thead>
                          <tbody>
                            {staffDetails.map((detail) => (
                              <tr key={detail.id} className="border-t">
                                <td className="px-4 py-2">{detail.staff_name}</td>
                                <td className="px-4 py-2">{detail.role || '-'}</td>
                                <td className="px-4 py-2">{detail.sia_number || '-'}</td>
                                <td className="px-4 py-2">{detail.pnc_info || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {!assignment.details_requested && (
                <p className="text-center text-gray-500 py-8">
                  Staff details have not been requested yet. Please wait for admin to request them.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Documents</CardTitle>
              <CardDescription>Briefing documents and files for this event</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-gray-600">{doc.file_type}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No documents available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proforma Tab - Before Event */}
        {!isEventPassed && (
          <TabsContent value="proforma" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Proforma Invoice</CardTitle>
                    <CardDescription>
                      Proforma invoice for this event based on your assignment and staff times
                    </CardDescription>
                  </div>
                  {proformaHTML && (
                    <Button onClick={handleGenerateInvoice} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignment && assignment.status === 'accepted' ? (
                  <div className="space-y-4">
                    {proformaHTML ? (
                      <div className="border rounded-xl shadow-inner bg-gray-50 p-6 overflow-auto max-h-[800px]">
                        <div className="bg-white shadow-sm p-8 min-h-[800px] mx-auto max-w-[800px]" dangerouslySetInnerHTML={{ __html: extractBodyContent(proformaHTML) }} />
                      </div>
                    ) : staffTimes.length > 0 ? (
                      <div className="border rounded-lg p-4 bg-yellow-50">
                        <p className="text-sm text-yellow-800">
                          Loading proforma invoice...
                        </p>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-yellow-50">
                        <p className="text-sm text-yellow-800">
                          Staff times have not been set yet. The proforma will be available once staff times are assigned.
                        </p>
                      </div>
                    )}
                    
                    {staffTimes.length > 0 && (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Staff Times Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="grid grid-cols-4 gap-4 font-medium text-gray-700 pb-2 border-b">
                            <div>Role</div>
                            <div>Count</div>
                            <div>Shifts</div>
                            <div>Total Hours</div>
                          </div>
                          {(() => {
                            const roleSummary = staffTimes.reduce((acc, time) => {
                              const role = time.role_type;
                              if (!acc[role]) {
                                acc[role] = { count: 0, shifts: new Set(), hours: 0 };
                              }
                              acc[role].count += time.staff_count;
                              acc[role].shifts.add(time.shift_number);
                              const startTime = new Date(`2000-01-01T${time.start_time}`);
                              const endTime = new Date(`2000-01-01T${time.end_time}`);
                              if (endTime < startTime) {
                                endTime.setDate(endTime.getDate() + 1);
                              }
                              const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                              acc[role].hours += time.staff_count * hours;
                              return acc;
                            }, {} as Record<string, { count: number; shifts: Set<number>; hours: number }>);

                            // Define role order: Manager, Supervisor, SIA, Stewards
                            const roleOrder = ['managers', 'supervisors', 'sia', 'stewards'];
                            const getRoleOrder = (roleType: string): number => {
                              const index = roleOrder.indexOf(roleType);
                              return index === -1 ? 999 : index;
                            };
                            
                            // Map role types to display names
                            const getRoleDisplayName = (roleType: string): string => {
                              const displayNames: Record<string, string> = {
                                'managers': 'Manager',
                                'supervisors': 'Supervisor',
                                'sia': 'SIA',
                                'stewards': 'Steward',
                              };
                              return displayNames[roleType] || roleType.charAt(0).toUpperCase() + roleType.slice(1);
                            };

                            // Sort roles by predefined order
                            const sortedRoles = Object.entries(roleSummary).sort((a, b) => 
                              getRoleOrder(a[0]) - getRoleOrder(b[0])
                            );

                            return sortedRoles.map(([role, data]) => (
                              <div key={role} className="grid grid-cols-4 gap-4">
                                <div>{getRoleDisplayName(role)}</div>
                                <div>{data.count}</div>
                                <div>{data.shifts.size}</div>
                                <div>{data.hours.toFixed(2)}</div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Proforma invoice will be available once your assignment is accepted.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Invoicing Tab - After Event */}
        {isEventPassed && (
          <TabsContent value="invoicing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Submit Invoice</CardTitle>
                <CardDescription>
                  Upload your invoice for this completed event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventInvoice ? (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Invoice Status</span>
                        <Badge
                          variant={eventInvoice.status === 'paid' ? 'success' : 'warning'}
                        >
                          {eventInvoice.status.charAt(0).toUpperCase() +
                            eventInvoice.status.slice(1)}
                        </Badge>
                      </div>
                      {eventInvoice.payment_date && (
                        <p className="text-sm text-gray-600">
                          Paid on: {format(new Date(eventInvoice.payment_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="font-semibold mb-2">Upload Your Invoice</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Please upload your invoice for this completed event. The invoice should reflect the actual hours worked and any adjustments from the proforma.
                      </p>
                    </div>
                    <FileUpload
                      onFileSelect={handleInvoiceUpload}
                      accept=".pdf,.jpg,.jpeg,.png"
                      maxSize={10}
                      label="Upload Invoice"
                      description="Upload your invoice file (PDF or image format)"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

