'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Upload, CheckCircle, XCircle, Download, Sparkles, FileText, ImageIcon } from 'lucide-react';
import type { StaffDetail } from '@/lib/types';
import { exportStaffDetailsTemplateCSV, downloadCSV } from '@/lib/export';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ParsedStaff {
  staff_name: string;
  role?: 'Manager' | 'Supervisor' | 'SIA' | 'Steward';
  sia_number?: string;
  pnc_info?: string;
  row: number;
  valid: boolean;
  errors: string[];
  confidence?: number;
}

interface StaffBulkUploadProps {
  assignmentId: string;
  onUpload: (staff: Omit<StaffDetail, 'id'>[]) => void;
}

export function StaffBulkUpload({ assignmentId, onUpload }: StaffBulkUploadProps) {
  const { toast } = useToast();
  const [parsedStaff, setParsedStaff] = useState<ParsedStaff[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('csv');

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
        confidence: 1.0
      };

      parsed.push(staff);
    });

    return parsed;
  };

  const handleCSVFileSelect = async (file: File) => {
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

  const handleAIFileSelect = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/document-intelligence', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('AI processing failed');
      }

      const data = await response.json();
      
      const parsed: ParsedStaff[] = data.staff.map((s: any, index: number) => {
        const errors = s.validation?.errors || [];
        return {
          staff_name: s.name,
          role: s.role,
          sia_number: s.siaNumber,
          pnc_info: s.expiryDate ? `Expiry: ${s.expiryDate}` : undefined,
          row: index + 1,
          valid: errors.length === 0,
          errors: errors,
          confidence: s.confidence
        };
      });

      setParsedStaff(parsed);
      
      toast({
        title: 'AI Extraction Complete',
        description: `Successfully extracted ${parsed.length} staff details from the document.`,
        variant: 'success',
      });

    } catch (error) {
      console.error('AI Extraction error:', error);
      toast({
        title: 'Extraction Failed',
        description: 'Failed to extract data from the document. Please ensure it is a clear image or try CSV upload.',
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
              Upload staff details via CSV or use AI to scan lists/licenses
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="hidden sm:flex">
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV Upload
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              AI Scanner (Image/PDF)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="csv" className="space-y-4">
            <FileUpload
              onFileSelect={handleCSVFileSelect}
              accept=".csv"
              maxSize={5}
              label="Upload CSV File"
              description="CSV format: Staff Name, Role, SIA Number, PNC Info"
            />
            <div className="text-center sm:hidden">
              <Button variant="link" size="sm" onClick={handleDownloadTemplate}>
                Download CSV Template
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-4">
             <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-indigo-900">AI Document Intelligence</h4>
                  <p className="text-sm text-indigo-700 mt-1">
                    Upload an image or scan of a staff list or SIA license. Our AI will extract the details automatically.
                    Supported formats: JPG, PNG.
                  </p>
                </div>
              </div>
            </div>
            
            <FileUpload
              onFileSelect={handleAIFileSelect}
              accept="image/jpeg,image/png,image/jpg"
              maxSize={10}
              label="Upload Document Image"
              description="Take a photo or upload a scan of the staff list"
            />
          </TabsContent>
        </Tabs>

        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-gray-600">Processing document...</span>
          </div>
        )}

        {!isProcessing && parsedStaff.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-300">
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
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>SIA Number</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedStaff.map((staff, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{staff.staff_name || '-'}</TableCell>
                      <TableCell>{staff.role || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{staff.sia_number || '-'}</TableCell>
                      <TableCell className="text-xs text-gray-500 max-w-[200px] truncate" title={staff.pnc_info}>
                        {staff.pnc_info || '-'}
                        {staff.confidence !== undefined && staff.confidence < 0.9 && (
                          <Badge variant="outline" className="ml-2 text-xs border-orange-200 text-orange-700">
                            Low Confidence
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {staff.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-2" title={staff.errors.join(', ')}>
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-600 truncate max-w-[150px]">
                              {staff.errors[0]}
                            </span>
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
