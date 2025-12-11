'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/shared/FileUpload';
import { useDataStore } from '@/lib/data-store';
import { useToast } from '@/components/ui/use-toast';
import type { Assignment, Provider } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ConfirmTimesheetsDialogProps {
  assignment: Assignment;
  provider: Provider;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmTimesheetsDialog({
  assignment,
  provider,
  open,
  onOpenChange,
}: ConfirmTimesheetsDialogProps) {
  const { confirmTimesheets } = useDataStore();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      toast({
        title: 'File Required',
        description: 'Please upload the signed timesheets.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmTimesheets(assignment.id, file);
      
      toast({
        title: 'Timesheets Confirmed',
        description: 'Timesheets have been confirmed and sent to the provider.',
        variant: 'success',
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error confirming timesheets:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm timesheets',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Timesheets</DialogTitle>
          <DialogDescription>
            Upload the signed timesheets for {provider.company_name}. This will notify the provider and allow them to invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="timesheet-file">Signed Timesheets</Label>
            <FileUpload
              onFileSelect={setFile}
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5}
              label="Upload Timesheets"
              description="Upload scanned PDF or photo of signed sheets"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!file || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm & Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



