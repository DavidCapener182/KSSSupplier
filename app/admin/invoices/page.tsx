'use client';

import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { useState, useMemo } from 'react';
import { Download, X, FileText, PoundSterling, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SearchInput } from '@/components/shared/SearchInput';
import { exportInvoicesToCSV, downloadCSV } from '@/lib/export';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { useEffect } from 'react';
import { generateInvoiceHTML } from '@/lib/invoice-html';
import { generateContractorAgreement } from '@/lib/agreement-template';
import type { Invoice } from '@/lib/types';

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

const formatCurrency = (value: number | null | undefined) =>
  currencyFormatter.format(value || 0);

export default function InvoicesPage() {
  const { toast } = useToast();
  const { 
    invoices, 
    providers, 
    events, 
    assignments,
    updateInvoiceStatus, 
    loadInvoices, 
    loadProviders, 
    loadEvents, 
    loadAssignments,
    loadStaffTimes,
    getStaffTimesByAssignment,
    loadOnboardingDocuments,
    getOnboardingDocuments
  } = useDataStore();
  
  useEffect(() => {
    loadInvoices();
    loadProviders();
    loadEvents();
    loadAssignments();
  }, [loadInvoices, loadProviders, loadEvents, loadAssignments]);

  // Auto-update proforma invoices to outstanding after 30 days from event end date
  useEffect(() => {
    if (invoices.length === 0 || events.length === 0) return;
    
    const updateProformaToOutstanding = async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const updates: string[] = [];
      
      for (const invoice of invoices) {
        if (invoice.status === 'proforma') {
          const event = events.find((e) => e.id === invoice.event_id);
          if (!event) continue;
          
          // Use end_date if available, otherwise use date
          const eventEndDate = event.end_date ? parseISO(event.end_date) : parseISO(event.date);
          const daysSinceEventEnd = differenceInDays(today, eventEndDate);
          
          // If 30 days or more have passed since event end, change to outstanding
          if (daysSinceEventEnd >= 30) {
            updates.push(invoice.id);
          }
        }
      }
      
      // Batch update all invoices that need to be changed
      if (updates.length > 0) {
        await Promise.all(updates.map(id => updateInvoiceStatus(id, 'outstanding')));
        await loadInvoices(); // Reload to update UI
      }
    };
    
    updateProformaToOutstanding();
  }, [invoices, events, updateInvoiceStatus, loadInvoices]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedProforma, setSelectedProforma] = useState<Invoice | null>(null);
  const [proformaHTML, setProformaHTML] = useState<string | null>(null);
  const [isLoadingProforma, setIsLoadingProforma] = useState(false);


  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((invoice) => invoice.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((invoice) => {
        const event = events.find((e) => e.id === invoice.event_id);
        const provider = providers.find((p) => p.id === invoice.provider_id);
        return (
          event?.name.toLowerCase().includes(query) ||
          provider?.company_name.toLowerCase().includes(query) ||
          invoice.amount?.toString().includes(query)
        );
      });
    }

    return filtered;
  }, [invoices, statusFilter, searchQuery, events, providers]);

  const invoiceTotals = useMemo(() => {
    return filteredInvoices.reduce(
      (acc, invoice) => {
        const amount = invoice.amount || 0;
        if (invoice.status === 'proforma') {
          acc.totalProformaValue += amount;
          acc.proformaCount += 1;
        } else if (invoice.status === 'outstanding') {
          acc.outstandingValue += amount;
          acc.pendingCount += 1;
        } else {
          acc.totalInvoiceValue += amount;
          acc.invoiceCount += 1;
          if (invoice.status === 'paid') {
            acc.paidValue += amount;
            acc.paidCount += 1;
          } else {
            acc.outstandingValue += amount;
            acc.pendingCount += 1;
          }
        }
        return acc;
      },
      {
        totalProformaValue: 0,
        totalInvoiceValue: 0,
        paidValue: 0,
        outstandingValue: 0,
        proformaCount: 0,
        invoiceCount: 0,
        paidCount: 0,
        pendingCount: 0,
      }
    );
  }, [filteredInvoices]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleMarkAsPaid = async (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    const provider = invoice ? providers.find((p) => p.id === invoice.provider_id) : null;
    await updateInvoiceStatus(invoiceId, 'paid', new Date().toISOString());
    await loadInvoices(); // Reload to update UI
    toast({
      title: 'Invoice Marked as Paid',
      description: `Invoice from ${provider?.company_name || 'provider'} has been marked as paid.`,
      variant: 'success',
    });
  };

  const handleViewProforma = async (invoice: Invoice) => {
    setSelectedProforma(invoice);
    setIsLoadingProforma(true);
    setProformaHTML(null);

    try {
      const event = events.find((e) => e.id === invoice.event_id);
      const provider = providers.find((p) => p.id === invoice.provider_id);
      const assignment = assignments.find((a) => a.event_id === invoice.event_id && a.provider_id === invoice.provider_id);

      if (!event || !provider || !assignment) {
        toast({
          title: 'Error',
          description: 'Could not find event, provider, or assignment for this proforma.',
          variant: 'destructive',
        });
        setIsLoadingProforma(false);
        return;
      }

      // Load staff times
      await loadStaffTimes(assignment.id);
      const times = getStaffTimesByAssignment(assignment.id);
      const staffTimesMap = new Map<string, any[]>();
      if (times && times.length > 0) {
        staffTimesMap.set(assignment.id, times);
      }

      // Load onboarding documents to get agreement content for rates
      await loadOnboardingDocuments(provider.id);
      const onboardingDocs = getOnboardingDocuments(provider.id);
      let agreementDoc = onboardingDocs.find(
        (doc) => doc.document_type === 'contractor_agreement'
      );

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

      // Generate the proforma HTML
      const htmlContent = generateInvoiceHTML(
        event,
        [assignment],
        [provider],
        staffTimesMap,
        true, // Always proforma
        agreementContent
      );
      setProformaHTML(htmlContent);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load proforma',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingProforma(false);
    }
  };

  return (
    <div className="space-y-8 p-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-2">Manage provider invoices</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const csv = exportInvoicesToCSV(invoices, events, providers);
                downloadCSV(csv, `invoices-${format(new Date(), 'yyyy-MM-dd')}.csv`);
              }}
              className="bg-background hover:bg-accent"
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export CSV</TooltipContent>
        </Tooltip>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-card h-full flex flex-col">
          <CardHeader className="pb-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <CardDescription className="text-blue-600 dark:text-blue-400 font-medium">Total Proforma</CardDescription>
              <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{formatCurrency(invoiceTotals.totalProformaValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {invoiceTotals.proformaCount} proforma{invoiceTotals.proformaCount === 1 ? '' : 's'}
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-card h-full flex flex-col">
          <CardHeader className="pb-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-medium">Total Invoiced</CardDescription>
              <PoundSterling className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{formatCurrency(invoiceTotals.totalInvoiceValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {invoiceTotals.invoiceCount} invoice{invoiceTotals.invoiceCount === 1 ? '' : 's'}
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-green-50 to-white dark:from-green-900/20 dark:to-card h-full flex flex-col">
          <CardHeader className="pb-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <CardDescription className="text-green-600 dark:text-green-400 font-medium">Paid Value</CardDescription>
              <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{formatCurrency(invoiceTotals.paidValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {invoiceTotals.paidCount} paid
          </CardContent>
        </Card>
        <Card className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-card h-full flex flex-col">
          <CardHeader className="pb-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <CardDescription className="text-amber-600 dark:text-amber-400 font-medium">Outstanding</CardDescription>
              <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{formatCurrency(invoiceTotals.outstandingValue)}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {invoiceTotals.pendingCount} pending
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md bg-card">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-lg font-semibold text-foreground">All Invoices</CardTitle>
          <CardDescription className="text-muted-foreground">View and manage invoices from providers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border bg-muted/20">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Search by event, provider, or amount..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="proforma">Proforma</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                  </SelectContent>
                </Select>
                {(searchQuery || statusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-2 px-1">
              Showing {filteredInvoices.length} of {invoices.length} invoices
            </div>
          </div>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="font-semibold text-foreground">Event</TableHead>
                <TableHead className="font-semibold text-foreground">Provider</TableHead>
                <TableHead className="font-semibold text-foreground">Amount</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground">Submitted</TableHead>
                <TableHead className="font-semibold text-foreground">Payment Date</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length > 0 ? (
                paginatedInvoices.map((invoice) => {
                  const event = events.find((e) => e.id === invoice.event_id);
                  const provider = providers.find((p) => p.id === invoice.provider_id);
                  return (
                    <TableRow 
                      key={invoice.id}
                      className={`
                        ${invoice.status === 'proforma' ? 'cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/20' : 'hover:bg-muted/50'} 
                        border-b border-border last:border-0 transition-colors
                      `}
                      onClick={invoice.status === 'proforma' ? () => handleViewProforma(invoice) : undefined}
                    >
                      <TableCell className="font-medium text-foreground">
                        {event?.name || 'Unknown Event'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{provider?.company_name || 'Unknown Provider'}</TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {invoice.amount ? `£${invoice.amount.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.status === 'paid' ? (
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-transparent">Paid</Badge>
                        ) : invoice.status === 'proforma' ? (
                          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-transparent">Proforma</Badge>
                        ) : invoice.status === 'outstanding' ? (
                          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-transparent">Outstanding</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-transparent">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.created_at
                          ? format(new Date(invoice.created_at), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.payment_date
                          ? format(new Date(invoice.payment_date), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {invoice.status === 'proforma' ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProforma(invoice);
                                }}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsPaid(invoice.id);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                            </>
                          ) : invoice.status === 'outstanding' ? (
                            <>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-accent">
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                onClick={() => handleMarkAsPaid(invoice.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-accent">
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </Button>
                              {invoice.status === 'pending' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                                  onClick={() => handleMarkAsPaid(invoice.id)}
                                >
                                  Mark Paid
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    <EmptyState
                      icon={FileText}
                      title="No Invoices Found"
                      description={searchQuery || statusFilter !== 'all'
                        ? "No invoices match your current filters. Try adjusting your search or filter criteria."
                        : "No invoices have been submitted yet. Invoices will appear here once providers upload them."}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-gray-100">
            {filteredInvoices.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredInvoices.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Proforma Dialog */}
      <Dialog open={!!selectedProforma} onOpenChange={(open) => !open && setSelectedProforma(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Proforma Invoice</DialogTitle>
            <DialogDescription>
              {selectedProforma && (
                <span className="flex items-center gap-2 mt-2 text-base">
                  <span className="font-semibold text-gray-900">{events.find((e) => e.id === selectedProforma.event_id)?.name || 'Unknown Event'}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{providers.find((p) => p.id === selectedProforma.provider_id)?.company_name || 'Unknown Provider'}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6">
            {isLoadingProforma ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading proforma invoice...</p>
                </div>
              </div>
            ) : proformaHTML ? (
              <div className="border rounded-xl shadow-inner bg-gray-50 p-6 overflow-auto max-h-[60vh]">
                <div className="bg-white shadow-sm p-8 min-h-[800px] mx-auto max-w-[800px]" dangerouslySetInnerHTML={{ __html: proformaHTML }} />
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No proforma data available</p>
              </div>
            )}
          </div>
          {proformaHTML && (
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedProforma(null)}>Close</Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={async () => {
                  if (!selectedProforma) return;
                  const event = events.find((e) => e.id === selectedProforma.event_id);
                  const provider = providers.find((p) => p.id === selectedProforma.provider_id);
                  const assignment = assignments.find((a) => a.event_id === selectedProforma.event_id && a.provider_id === selectedProforma.provider_id);
                  
                  if (!event || !provider || !assignment) {
                    toast({
                      title: 'Error',
                      description: 'Could not find event, provider, or assignment for this proforma.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  try {
                    await loadStaffTimes(assignment.id);
                    const times = getStaffTimesByAssignment(assignment.id);
                    const staffTimesMap = new Map<string, any[]>();
                    if (times && times.length > 0) {
                      staffTimesMap.set(assignment.id, times);
                    }

                    await loadOnboardingDocuments(provider.id);
                    const onboardingDocs = getOnboardingDocuments(provider.id);
                    let agreementDoc = onboardingDocs.find(
                      (doc) => doc.document_type === 'contractor_agreement'
                    );

                    let agreementContent = agreementDoc?.content;
                    if (agreementDoc && (!agreementContent || agreementContent.length < 100)) {
                      const { generateContractorAgreement } = await import('@/lib/agreement-template');
                      agreementContent = generateContractorAgreement({
                        company_name: provider.company_name,
                        address: provider.address || '',
                        company_registration: provider.company_registration || '',
                        contact_email: provider.contact_email,
                        contact_phone: provider.contact_phone,
                      });
                    }

                    const { generateInvoicePDF } = await import('@/lib/pdf-export');
                    await generateInvoicePDF(event, [assignment], [provider], staffTimesMap, true, agreementContent);
                  } catch (error: any) {
                    toast({
                      title: 'Error',
                      description: error.message || 'Failed to generate PDF',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
