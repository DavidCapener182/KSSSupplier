'use client';

import { useAuth } from '@/lib/auth-context';
import { useDataStore } from '@/lib/data-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useEffect } from 'react';

export default function ProviderInvoicesPage() {
  const { user } = useAuth();
  const { providers, invoices, events, loadProviders, loadInvoices, loadEvents } = useDataStore();
  
  useEffect(() => {
    loadProviders();
    loadInvoices();
    loadEvents();
  }, [loadProviders, loadInvoices, loadEvents]);

  const provider = providers.find((p) => p.user_id === user?.id);
  const providerInvoices = provider
    ? invoices.filter((inv) => inv.provider_id === provider.id)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
        <p className="text-muted-foreground mt-1">View and manage your submitted invoices</p>
      </div>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">My Invoices</CardTitle>
          <CardDescription className="text-muted-foreground">All invoices you have submitted</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-muted/50">
                <TableHead className="text-muted-foreground">Event</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Submitted</TableHead>
                <TableHead className="text-muted-foreground">Payment Date</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerInvoices.length > 0 ? (
                providerInvoices.map((invoice) => {
                  const event = events.find((e) => e.id === invoice.event_id);
                  return (
                    <TableRow key={invoice.id} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">
                        {event?.name || 'Unknown Event'}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {invoice.amount ? `£${invoice.amount.toFixed(2)}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.status === 'paid' ? (
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">Paid</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.created_at
                          ? format(new Date(invoice.created_at), 'MMM dd, yyyy')
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.payment_date
                          ? format(new Date(invoice.payment_date), 'MMM dd, yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="bg-background hover:bg-accent text-foreground">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No invoices submitted yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

