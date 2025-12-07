'use client';

import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';

export default function PendingProvidersPage() {
  const { getPendingProviders, approveProvider, rejectProvider, loadProviders, onboardingDocuments, loadAllOnboardingDocuments } = useDataStore();
  
  useEffect(() => {
    loadProviders();
    loadAllOnboardingDocuments();
  }, [loadProviders, loadAllOnboardingDocuments]);
  const { toast } = useToast();
  const pendingProviders = getPendingProviders();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleApprove = (id: string) => {
    approveProvider(id);
    toast({
      title: 'Provider Approved',
      description: 'The provider has been approved and now has access to the system.',
      variant: 'success',
    });
  };

  const handleReject = () => {
    if (selectedProvider) {
      rejectProvider(selectedProvider, rejectionReason || undefined);
      toast({
        title: 'Provider Rejected',
        description: 'The provider has been rejected.',
        variant: 'destructive',
      });
      setRejectDialogOpen(false);
      setSelectedProvider(null);
      setRejectionReason('');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Providers', href: '/admin/providers' },
          { label: 'Pending Approvals' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold">Pending Provider Approvals</h1>
        <p className="text-gray-600 mt-1">
          Review and approve or reject supplier onboarding applications
        </p>
      </div>

      {pendingProviders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pendingProviders.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-400" />
                    <CardTitle className="text-lg">{provider.company_name}</CardTitle>
                  </div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
                <CardDescription>{provider.contact_email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider.address && (
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm">{provider.address}</p>
                  </div>
                )}
                {provider.company_registration && (
                  <div>
                    <p className="text-xs text-gray-500">Company Registration</p>
                    <p className="text-sm">{provider.company_registration}</p>
                  </div>
                )}
                {provider.contact_phone && (
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm">{provider.contact_phone}</p>
                  </div>
                )}
                {provider.director_contact_name && (
                  <div>
                    <p className="text-xs text-gray-500">Director</p>
                    <p className="text-sm">{provider.director_contact_name}</p>
                  </div>
                )}
                {provider.submitted_at && (
                  <div>
                    <p className="text-xs text-gray-500">Submitted</p>
                    <p className="text-sm">
                      {format(new Date(provider.submitted_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Documents</p>
                  <div className="space-y-2">
                    {onboardingDocuments
                      .filter((doc) => doc.provider_id === provider.id)
                      .map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between text-sm border rounded px-2 py-1">
                          <span className="capitalize">{doc.title}</span>
                          <span className="text-xs text-gray-600">
                            {doc.completed
                              ? `Signed ${doc.completed_at ? format(new Date(doc.completed_at), 'MMM dd, yyyy') : ''}`
                              : 'Pending'}
                          </span>
                        </div>
                      ))}
                    {onboardingDocuments.filter((doc) => doc.provider_id === provider.id).length === 0 && (
                      <p className="text-sm text-gray-600">No documents yet</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApprove(provider.id)}
                    className="flex-1"
                    variant="default"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setRejectDialogOpen(true);
                    }}
                    className="flex-1"
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-500">No pending provider approvals</p>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Provider Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this provider? This action cannot be undone. You can
              optionally provide a reason for rejection.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">
              Reject Provider
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

