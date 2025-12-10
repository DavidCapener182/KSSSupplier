'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import { StaffDetail } from '@/lib/types';
import { validateSIALicense } from '@/lib/ai/sia-validator';
import { format } from 'date-fns';

interface SIALicenseVerificationProps {
  staffDetails: StaffDetail[];
  onRefresh?: () => void;
}

export function SIALicenseVerification({ staffDetails, onRefresh }: SIALicenseVerificationProps) {
  const [filter, setFilter] = useState<'all' | 'issues'>('all');

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

    const validation = validateSIALicense(staff.sia_number || '', expiryDateStr);
    
    return {
      ...staff,
      validation,
      hasIssue: !validation.isValid
    };
  });

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
                <TableHead>Expiry Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id} className={staff.hasIssue ? "bg-red-50/50" : ""}>
                    <TableCell className="font-medium">{staff.staff_name}</TableCell>
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
                      {staff.sia_expiry_date 
                        ? format(new Date(staff.sia_expiry_date), 'dd/MM/yyyy')
                        : '-'}
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
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Valid
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {staff.hasIssue && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-100">
                          Request Update
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-gray-500">
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
