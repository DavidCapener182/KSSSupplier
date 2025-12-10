'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, ShieldAlert, ShieldCheck, RefreshCw, Loader2, Info } from 'lucide-react';
import { StaffDetail, Assignment } from '@/lib/types';
import { validateSIALicense } from '@/lib/ai/sia-validator';
import { format } from 'date-fns';
import { searchSIARegister, requestSIAUpdate, SIARegisterResult } from '@/app/actions/sia-register-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';

interface SIALicenseVerificationProps {
  staffDetails: StaffDetail[];
  assignments?: Assignment[];
  onRefresh?: () => void;
}

// Simple in-memory cache for verification results during the session
const verificationCache: Record<string, SIARegisterResult> = {};

export function SIALicenseVerification({ staffDetails, assignments = [], onRefresh }: SIALicenseVerificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'issues'>('all');
  const [verificationResults, setVerificationResults] = useState<Record<string, SIARegisterResult>>({});
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const [requestingUpdate, setRequestingUpdate] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const verifyLicenses = async () => {
      // Find staff with SIA numbers that need verification
      const staffToVerify = staffDetails.filter(staff => 
        staff.sia_number && 
        staff.sia_number.replace(/\s/g, '').length === 16 && 
        !verificationResults[staff.sia_number] &&
        !isVerifying[staff.sia_number]
      );

      if (staffToVerify.length === 0) return;

      // Mark as verifying
      setIsVerifying(prev => {
        const next = { ...prev };
        staffToVerify.forEach(s => {
          if (s.sia_number) next[s.sia_number] = true;
        });
        return next;
      });

      // Process in parallel (max 5 at a time to be polite to the server)
      const batchSize = 5;
      for (let i = 0; i < staffToVerify.length; i += batchSize) {
        const batch = staffToVerify.slice(i, i + batchSize);
        await Promise.all(batch.map(async (staff) => {
          if (!staff.sia_number) return;
          
          const siaNumber = staff.sia_number;
          
          // Check cache first
          if (verificationCache[siaNumber]) {
            setVerificationResults(prev => ({
              ...prev,
              [siaNumber]: verificationCache[siaNumber]
            }));
            setIsVerifying(prev => ({ ...prev, [siaNumber]: false }));
            return;
          }

          try {
            const result = await searchSIARegister(siaNumber);
            verificationCache[siaNumber] = result;
            setVerificationResults(prev => ({
              ...prev,
              [siaNumber]: result
            }));
          } catch (error) {
            console.error(`Error verifying SIA ${siaNumber}:`, error);
          } finally {
            setIsVerifying(prev => ({ ...prev, [siaNumber]: false }));
          }
        }));
      }
    };

    verifyLicenses();
  }, [staffDetails]); // Only re-run if staff list changes

  const processedStaff = staffDetails.map(staff => {
    // Use sia_expiry_date from database, or try to extract from pnc_info as fallback
    let expiryDateStr = staff.sia_expiry_date;
    
    // If no expiry date in database, try to extract from pnc_info
    if (!expiryDateStr && staff.pnc_info) {
      const dateMatch = staff.pnc_info.match(/(\d{4}-\d{2}-\d{2})/) || staff.pnc_info.match(/(\d{2}\/\d{2}\/\d{4})/);
      expiryDateStr = dateMatch ? dateMatch[0] : undefined;
    }
    
    // Normalize date format if needed (DD/MM/YYYY to YYYY-MM-DD)
    if (expiryDateStr && expiryDateStr.includes('/')) {
        const parts = expiryDateStr.split('/');
        if (parts.length === 3) {
          expiryDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
    }

    const localValidation = validateSIALicense(staff.sia_number || '', expiryDateStr);
    const registerResult = staff.sia_number ? verificationResults[staff.sia_number] : undefined;
    const isLoading = staff.sia_number ? isVerifying[staff.sia_number] : false;
    
    // Determine overall issue status
    // Issue if:
    // 1. Local validation failed (format incorrect, locally checked expiry)
    // 2. Register check finished and found issues (not found, expired, suspended, etc.)
    // 3. Register check finished and names don't match (optional check)
    
    let registerIssue = false;
    if (registerResult) {
        if (!registerResult.found) registerIssue = true;
        if (registerResult.status && registerResult.status !== 'Active') registerIssue = true;
        // Check expiry if available from register
        if (registerResult.expiryDate) {
             const regExpiry = new Date(registerResult.expiryDate);
             if (regExpiry < new Date()) registerIssue = true;
        }
    }

    // Find the assignment for this staff member
    const assignment = assignments.find(a => a.id === staff.assignment_id);

    return {
      ...staff,
      validation: localValidation,
      registerResult,
      isLoading,
      hasIssue: !localValidation.isValid || registerIssue,
      assignment
    };
  });

  const handleRequestUpdate = async (staff: typeof processedStaff[0]) => {
    if (!staff.sia_number || !staff.assignment || !user?.id) {
      toast({
        title: 'Error',
        description: 'Missing information to send request',
        variant: 'destructive',
      });
      return;
    }

    setRequestingUpdate(prev => ({ ...prev, [staff.id]: true }));

    try {
      const result = await requestSIAUpdate(
        staff.id,
        staff.staff_name,
        staff.sia_number,
        staff.assignment.id,
        user.id
      );

      if (result.success) {
        toast({
          title: 'Message Sent',
          description: `Request for updated SIA number sent to provider for ${staff.staff_name}`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send message',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setRequestingUpdate(prev => ({ ...prev, [staff.id]: false }));
    }
  };

  const issuesCount = processedStaff.filter(s => s.hasIssue).length;
  const filteredStaff = filter === 'issues' 
    ? processedStaff.filter(s => s.hasIssue) 
    : processedStaff;

  if (processedStaff.length === 0) {
    return (
      <Card>
        <CardHeader>
           <CardTitle>SIA License Verification</CardTitle>
           <CardDescription>No staff details found to verify.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={issuesCount > 0 ? "border-red-200" : "border-green-200"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {issuesCount > 0 ? (
              <ShieldAlert className="h-5 w-5 text-red-600" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-green-600" />
            )}
            <CardTitle>SIA License Verification</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setFilter(filter === 'all' ? 'issues' : 'all')}
              className={filter === 'issues' ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : ''}
            >
              {filter === 'issues' ? 'Show All Staff' : `Show Issues Only (${issuesCount})`}
            </Button>
            {onRefresh && (
                <Button variant="ghost" size="icon" onClick={onRefresh}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            )}
          </div>
        </div>
        <CardDescription>
          {issuesCount > 0 
            ? `${issuesCount} staff members have potential license issues.` 
            : "All staff licenses appear valid."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Staff Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>SIA Number</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Register Check</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => {
                  // Determine row color based on register check
                  let rowClassName = "";
                  if (staff.registerResult) {
                    if (staff.registerResult.found) {
                      rowClassName = "bg-green-50/50";
                    } else {
                      rowClassName = "bg-red-50/50";
                    }
                  } else if (staff.hasIssue) {
                    rowClassName = "bg-red-50/50";
                  }
                  
                  return (
                  <TableRow key={staff.id} className={rowClassName}>
                    <TableCell className="font-medium">
                        {staff.staff_name}
                        {staff.registerResult?.found && (
                             <div className="text-xs text-muted-foreground mt-0.5">
                                Reg: {staff.registerResult.firstName} {staff.registerResult.surname}
                             </div>
                        )}
                    </TableCell>
                    <TableCell>
                      {staff.role ? (
                        <Badge variant="outline" className="font-normal">
                          {staff.role}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {staff.sia_number || <span className="text-red-500 italic">Missing</span>}
                    </TableCell>
                    <TableCell>
                      {staff.validation.errors.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {staff.validation.errors.map((err, i) => (
                            <Badge key={i} variant="destructive" className="w-fit text-[10px] px-1 py-0 h-5">
                              {err}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 w-fit">
                              In Date
                            </Badge>
                            {staff.sia_expiry_date && (
                                <span className="text-xs text-muted-foreground">
                                    Exp: {format(new Date(staff.sia_expiry_date), 'dd/MM/yyyy')}
                                </span>
                            )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                        {staff.isLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-xs">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Checking Register...
                            </div>
                        ) : staff.registerResult ? (
                            staff.registerResult.found ? (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">Found</span>
                                    </div>
                                    <div className="text-xs space-y-0.5">
                                        <div className="flex gap-2">
                                            <span className="text-muted-foreground">Sector:</span>
                                            <span>{staff.registerResult.licenceSector}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className={staff.registerResult.status === 'Active' ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                                {staff.registerResult.status}
                                            </span>
                                        </div>
                                        {staff.registerResult.expiryDate && (
                                            <div className="flex gap-2">
                                                <span className="text-muted-foreground">Expires:</span>
                                                <span>{staff.registerResult.expiryDate}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-sm font-medium">Not Found in Register</span>
                                    {staff.registerResult.error && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="h-3 w-3 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{staff.registerResult.error}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            )
                        ) : (
                            <span className="text-xs text-muted-foreground">Waiting...</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right">
                      {staff.registerResult && !staff.registerResult.found && staff.sia_number && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
                          onClick={() => handleRequestUpdate(staff)}
                          disabled={requestingUpdate[staff.id]}
                        >
                          {requestingUpdate[staff.id] ? 'Sending...' : 'Request Update'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                    {filter === 'issues' ? 'No issues found.' : 'No staff loaded.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
