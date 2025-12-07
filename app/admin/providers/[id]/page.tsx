'use client';

import { useParams } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { useEffect, useMemo, useState } from 'react';
import { ProviderScorecard } from '@/components/admin/ProviderScorecard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ProviderDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const id = params.id as string;
  const { 
    providers, 
    assignments, 
    events, 
    invoices,
    onboardingDocuments,
    updateProvider,
    loadProviders, 
    loadAssignments, 
    loadEvents,
    loadInvoices,
    loadOnboardingDocuments,
  } = useDataStore();
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  useEffect(() => {
    loadProviders();
    loadAssignments();
    loadEvents();
    loadInvoices();
    if (id) {
      loadOnboardingDocuments(id);
    }
  }, [loadProviders, loadAssignments, loadEvents, loadInvoices, loadOnboardingDocuments, id]);

  const provider = providers.find((p) => p.id === id);

  const providerAssignments = useMemo(
    () => (provider ? assignments.filter((a) => a.provider_id === provider.id) : []),
    [assignments, provider]
  );
  const providerInvoices = useMemo(
    () => (provider ? invoices.filter((inv) => inv.provider_id === provider.id) : []),
    [invoices, provider]
  );

  const signedDocuments = useMemo(() => {
    if (!provider) return [];
    return onboardingDocuments
      .filter((doc) => doc.provider_id === provider.id && doc.completed)
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        type: doc.document_type,
        completed_at: doc.completed_at || doc.updated_at,
      }));
  }, [onboardingDocuments, provider]);

  useEffect(() => {
    setNotes(provider?.notes || '');
  }, [provider?.notes]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP',
      }),
    []
  );

  const shiftsCompleted = useMemo(() => {
    return providerAssignments.reduce((total, assignment) => {
      return (
        total +
        (assignment.actual_managers || 0) +
        (assignment.actual_supervisors || 0) +
        (assignment.actual_sia || 0) +
        (assignment.actual_stewards || 0)
      );
    }, 0);
  }, [providerAssignments]);

  const invoiceTotals = useMemo(() => {
    return providerInvoices.reduce(
      (acc, invoice) => {
        const amount = invoice.amount || 0;
        if (invoice.status === 'proforma') {
          acc.proformaValue += amount;
          acc.proformaCount += 1;
        } else {
          acc.invoiceValue += amount;
          acc.invoiceCount += 1;
          if (invoice.status === 'paid') {
            acc.paidValue += amount;
            acc.paidCount += 1;
          }
        }
        return acc;
      },
      { proformaValue: 0, proformaCount: 0, invoiceValue: 0, invoiceCount: 0, paidValue: 0, paidCount: 0 }
    );
  }, [providerInvoices]);

  const handleSaveNotes = async () => {
    if (!provider) return;
    setIsSavingNotes(true);
    try {
      await updateProvider(provider.id, { notes });
      toast({ title: 'Notes updated', variant: 'success' });
    } catch (error: any) {
      toast({ title: 'Error updating notes', description: error.message || 'Please try again', variant: 'destructive' });
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Provider not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/providers" className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Providers
        </Link>
        <h1 className="text-3xl font-bold">{provider.company_name}</h1>
        <p className="text-gray-600 mt-1">{provider.contact_email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Shifts Completed</CardDescription>
            <CardTitle className="text-2xl">{shiftsCompleted}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invoiced</CardDescription>
            <CardTitle className="text-2xl">{currencyFormatter.format(invoiceTotals.invoiceValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            {invoiceTotals.invoiceCount} invoice{invoiceTotals.invoiceCount === 1 ? '' : 's'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid</CardDescription>
            <CardTitle className="text-2xl">{currencyFormatter.format(invoiceTotals.paidValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            {invoiceTotals.paidCount} paid
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Proforma</CardDescription>
            <CardTitle className="text-2xl">{currencyFormatter.format(invoiceTotals.proformaValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            {invoiceTotals.proformaCount} proforma{invoiceTotals.proformaCount === 1 ? '' : 's'}
          </CardContent>
        </Card>
      </div>

      <ProviderScorecard provider={provider} assignments={assignments} events={events} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Director</p>
              <p className="text-sm">{provider.director_contact_name || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm">{provider.contact_phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm">{provider.contact_email || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Address</p>
              <p className="text-sm">{provider.address || 'Not provided'}</p>
            </div>
            {provider.company_registration && (
              <div>
                <p className="text-xs text-gray-500">Company Registration</p>
                <p className="text-sm">{provider.company_registration}</p>
              </div>
            )}
            {provider.status && (
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <Badge
                  variant={
                    provider.status === 'approved'
                      ? 'success'
                      : provider.status === 'pending'
                      ? 'warning'
                      : 'destructive'
                  }
                >
                  {provider.status}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment History</CardTitle>
            <CardDescription>{providerAssignments.length} total assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {providerAssignments.length > 0 ? (
                providerAssignments
                  .sort((a, b) => {
                    const dateA = a.accepted_at ? new Date(a.accepted_at).getTime() : 0;
                    const dateB = b.accepted_at ? new Date(b.accepted_at).getTime() : 0;
                    return dateB - dateA;
                  })
                  .slice(0, 10)
                  .map((assignment) => {
                    const event = events.find((e) => e.id === assignment.event_id);
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-2 border rounded text-sm"
                      >
                        <div>
                          <p className="font-medium">{event?.name || 'Unknown Event'}</p>
                          <p className="text-xs text-gray-600">
                            {event?.date && format(new Date(event.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            assignment.status === 'accepted'
                              ? 'success'
                              : assignment.status === 'pending'
                              ? 'warning'
                              : 'destructive'
                          }
                        >
                          {assignment.status}
                        </Badge>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-gray-500">No assignments yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signed Agreements</CardTitle>
            <CardDescription>Completed onboarding documents with signature dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {signedDocuments.length > 0 ? (
              signedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm">{doc.title}</p>
                    <p className="text-xs text-gray-600 capitalize">{doc.type?.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <div className="font-semibold text-gray-800">Signed</div>
                    <div>
                      {doc.completed_at
                        ? format(new Date(doc.completed_at), 'MMM dd, yyyy')
                        : 'Date unknown'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No signed agreements yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Add internal notes about this provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key contact details, preferences, agreements, issues..."
              rows={6}
            />
            <div className="flex justify-end">
              <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                {isSavingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

