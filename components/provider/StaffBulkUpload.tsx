'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Upload, CheckCircle, XCircle, Download } from 'lucide-react';
import type { StaffDetail } from '@/lib/types';
import { exportStaffDetailsTemplateCSV, downloadCSV } from '@/lib/export';

interface ParsedStaff {
  staff_name: string;
  role?: 'Manager' | 'Supervisor' | 'SIA' | 'Steward';
  sia_number?: string;
  pnc_info?: string;
  row: number;
  valid: boolean;
  errors: string[];
}

interface StaffBulkUploadProps {
  assignmentId: string;
  onUpload: (staff: Omit<StaffDetail, 'id'>[]) => void;
}

export function StaffBulkUpload({ assignmentId, onUpload }: StaffBulkUploadProps) {
  const { toast } = useToast();
  const [parsedStaff, setParsedStaff] = useState<ParsedStaff[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadTemplate = () => {
    const csv = exportStaffDetailsTemplateCSV();
    downloadCSV(csv, 'staff-details-template.csv');
  };

  const parseCSV = (csvText: string): ParsedStaff[] => {
    const lines = csvText.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      return [];
    }

    // Skip header row
    const dataLines = lines.slice(1);
    const parsed: ParsedStaff[] = [];

    dataLines.forEach((line, index) => {
      const row = index + 2; // +2 because we skipped header and arrays are 0-indexed
      // Handle CSV parsing considering potential quotes
      // Simple parsing: split by comma, trim quotes
      const columns = line.split(',').map((col) => col.trim().replace(/^"|"$/g, ''));
      const errors: string[] = [];

      if (columns.length < 1 || !columns[0]) {
        errors.push('Staff name is required');
      }

      // Validate role if present
      let role: 'Manager' | 'Supervisor' | 'SIA' | 'Steward' | undefined = undefined;
      const roleStr = columns[1] || '';
      if (roleStr) {
        const normalizedRole = roleStr.charAt(0).toUpperCase() + roleStr.slice(1).toLowerCase();
        if (['Manager', 'Supervisor', 'Sia', 'Steward'].includes(normalizedRole)) {
            // Fix case for SIA
            role = normalizedRole === 'Sia' ? 'SIA' : normalizedRole as any;
        } else if (normalizedRole === 'S.i.a' || normalizedRole === 'S.i.a.') {
            role = 'SIA';
        } else {
            // Don't error, just leave undefined or treat as note? 
            // Better to error to enforce data quality
            errors.push(`Invalid role: ${roleStr}. Must be Manager, Supervisor, SIA, or Steward`);
        }
      }

      const staff: ParsedStaff = {
        staff_name: columns[0] || '',
        role,
        sia_number: columns[2] || undefined,
        pnc_info: columns[3] || undefined,
        row,
        valid: errors.length === 0,
        errors,
      };

      parsed.push(staff);
    });

    return parsed;
  };

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      setParsedStaff(parsed);

      const validCount = parsed.filter((s) => s.valid).length;
      const invalidCount = parsed.length - validCount;

      if (invalidCount > 0) {
        toast({
          title: 'CSV Parsed',
          description: `${validCount} valid, ${invalidCount} invalid rows. Please review before uploading.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'CSV Parsed',
          description: `All ${validCount} rows are valid and ready to upload.`,
          variant: 'success',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse CSV file. Please check the format.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = () => {
    const validStaff = parsedStaff
      .filter((s) => s.valid)
      .map((s) => ({
        assignment_id: assignmentId,
        staff_name: s.staff_name,
        role: s.role,
        sia_number: s.sia_number,
        pnc_info: s.pnc_info,
      }));

    if (validStaff.length === 0) {
      toast({
        title: 'No Valid Data',
        description: 'Please fix errors before uploading.',
        variant: 'destructive',
      });
      return;
    }

    onUpload(validStaff);
    toast({
      title: 'Staff Details Uploaded',
      description: `${validStaff.length} staff member(s) have been added.`,
      variant: 'success',
    });
    setParsedStaff([]);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Bulk Upload Staff Details</CardTitle>
            <CardDescription className="mt-1">
              Upload a CSV file with staff details. Format: Staff Name, Role, SIA Number, PNC Info
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FileUpload
          onFileSelect={handleFileSelect}
          accept=".csv"
          maxSize={5}
          label="Upload CSV File"
          description="CSV format: Staff Name, Role, SIA Number, PNC Info"
        />

        {parsedStaff.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {parsedStaff.filter((s) => s.valid).length} valid,{' '}
                  {parsedStaff.filter((s) => !s.valid).length} invalid rows
                </p>
              </div>
              <Button onClick={handleUpload} disabled={parsedStaff.filter((s) => s.valid).length === 0}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Valid Rows
              </Button>
            </div>

            <div className="border rounded-lg max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>SIA Number</TableHead>
                    <TableHead>PNC Info</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedStaff.map((staff, index) => (
                    <TableRow key={index}>
                      <TableCell>{staff.row}</TableCell>
                      <TableCell>{staff.staff_name || '-'}</TableCell>
                      <TableCell>{staff.role || '-'}</TableCell>
                      <TableCell>{staff.sia_number || '-'}</TableCell>
                      <TableCell>{staff.pnc_info || '-'}</TableCell>
                      <TableCell>
                        {staff.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600">{staff.errors.join(', ')}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
