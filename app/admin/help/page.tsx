'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  BarChart3,
  Settings,
  FileCheck,
  Plus,
  MoreHorizontal,
  Download,
  Filter,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Help' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold">Help & Documentation</h1>
        <p className="text-gray-600 mt-1">Admin Guide for the KSS Event Staffing Platform</p>
      </div>

      {/* Quick Start Guide */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              <CardTitle>Quick Start Guide</CardTitle>
            </div>
            <CardDescription>Get started with the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="getting-started">
                <AccordionTrigger>Getting Started</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Log in to your account using your credentials</li>
                    <li>Navigate to the Dashboard to see an overview</li>
                    <li>Create your first event or view existing events</li>
                    <li>Assign providers to events with staff requirements</li>
                    <li>Track confirmations and manage assignments</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="navigation">
                <AccordionTrigger>Navigation</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm mb-2">Use the sidebar to navigate between sections:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Dashboard:</strong> Overview of events and metrics</li>
                    <li><strong>Events:</strong> Create and manage events</li>
                    <li><strong>Templates:</strong> Save and reuse event configurations</li>
                    <li><strong>Providers:</strong> View and manage labour providers</li>
                    <li><strong>Messages:</strong> Communicate with providers</li>
                    <li><strong>Reports:</strong> Generate custom reports</li>
                    <li><strong>Invoices:</strong> Review and approve provider invoices</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Feature Guides</CardTitle>
            <CardDescription>Learn how to use specific features</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="events">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Managing Events & Templates</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Creating Events:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to Events → Create Event</li>
                      <li>Enter event name, location, and date</li>
                      <li>Specify staff requirements (Managers, Supervisors, SIA, Stewards)</li>
                      <li>Save the event</li>
                    </ol>
                    <p className="mt-2"><strong>Event Templates:</strong></p>
                    <p className="ml-2">
                      Save time by creating templates for recurring events. Go to <strong>Events → Templates</strong> to manage them. You can then "Create from Template" when making a new event.
                    </p>
                    <p className="mt-2"><strong>Assigning Providers:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Open an event detail page</li>
                      <li>Click "Assign Provider"</li>
                      <li>Select a provider and specify staff numbers</li>
                      <li>The provider will receive a notification</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="providers">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Managing Providers & Onboarding</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Provider Onboarding:</strong></p>
                    <p className="ml-2">
                      New providers start in a "Pending" state. They must sign the Contractor Agreement and NDA.
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to <strong>Providers → Pending Approvals</strong> to review applications.</li>
                      <li>Check that all required documents are signed.</li>
                      <li>Click "Approve" to activate their account or "Reject" with a reason.</li>
                    </ol>
                    <p className="mt-2"><strong>Performance & Scorecards:</strong></p>
                    <p className="ml-2">
                      Click on any provider to view their scorecard, which tracks attendance reliability, document compliance, and assignment acceptance rates.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="finance">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Invoices & Finance</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Managing Invoices:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Navigate to the <strong>Invoices</strong> page.</li>
                      <li>Review uploaded invoices from providers.</li>
                      <li>Update status to "Approved" or "Paid" as you process them.</li>
                    </ol>
                    <p className="mt-2"><strong>Proformas:</strong></p>
                    <p className="ml-2">
                      You can issue proforma invoices or payment requests directly through the system for specific events.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="documents">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Document Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Event Documents:</strong></p>
                    <p className="ml-2">
                      Upload briefing packs, site maps, and risk assessments to an event. These are automatically shared with assigned providers.
                    </p>
                    <p className="mt-2"><strong>Compliance:</strong></p>
                    <p className="ml-2">
                      The system tracks expiration dates for provider insurance and certifications. You will be notified of upcoming expiries.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="reports">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Generating Reports</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Custom Reports:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to Reports page</li>
                      <li>Select report type (Overview, Attendance, Providers, Events)</li>
                      <li>Choose a date range and provider filter</li>
                      <li>View charts and statistics</li>
                      <li>Export to CSV or print</li>
                    </ol>
                    <p className="mt-2"><strong>Event Summary PDF:</strong></p>
                    <p className="ml-2">
                      On any event detail page, click "Export PDF" to generate a comprehensive event summary report.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Creating & Managing Events</h2>
              <p className="text-muted-foreground">
                The core of the platform is creating events and assigning staff requirements.
              </p>

              <div className="space-y-6">
                <div className="relative border-l-2 border-slate-200 pl-6 pb-2">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-200 border-2 border-white" />
                  <h3 className="font-semibold text-lg">1. Create New Event</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click the "New Event" button on the Events page. Fill in the location, date, and staff requirements.
                  </p>
                </div>
                 <div className="relative border-l-2 border-slate-200 pl-6 pb-2">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-200 border-2 border-white" />
                  <h3 className="font-semibold text-lg">2. Assign Providers</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Once created, open the event. Use the "Assign Provider" dialog to allocate specific numbers of staff to a supplier.
                  </p>
                </div>
                 <div className="relative border-l-2 border-slate-200 pl-6">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-slate-200 border-2 border-white" />
                  <h3 className="font-semibold text-lg">3. Monitor Fulfillment</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Track the status as providers accept the assignment and upload their staff lists.
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Mock for Event Creation */}
            <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Create Event Form</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Input placeholder="e.g., Summer Festival 2025" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label>Start Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-8" placeholder="Select date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input placeholder="City or Venue" />
                    </div>
                  </div>
                  
                  <Separator />
                  <Label>Staff Requirements</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between border rounded-md p-2">
                      <span className="text-sm">SIA Security</span>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-6 w-6">-</Button>
                        <span className="w-4 text-center text-sm">10</span>
                         <Button size="icon" variant="outline" className="h-6 w-6">+</Button>
                      </div>
                    </div>
                     <div className="flex items-center justify-between border rounded-md p-2">
                      <span className="text-sm">Stewards</span>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-6 w-6">-</Button>
                        <span className="w-4 text-center text-sm">25</span>
                         <Button size="icon" variant="outline" className="h-6 w-6">+</Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button>Create Event</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PROVIDERS TAB */}
        <TabsContent value="providers" className="space-y-6 mt-6">
           <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Managing Providers</h2>
              <p className="text-muted-foreground">
                Approve new suppliers and monitor their performance.
              </p>

              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Onboarding Workflow
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full mt-1">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">1. Provider Registers</h4>
                      <p className="text-xs text-muted-foreground">Provider creates an account. Status is "Onboarding".</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full mt-1">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">2. Document Submission</h4>
                      <p className="text-xs text-muted-foreground">Provider signs Agreements and NDAs.</p>
                    </div>
                  </div>
                   <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full mt-1">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">3. Admin Approval</h4>
                      <p className="text-xs text-muted-foreground">You review documents in "Pending Approvals" and activate the account.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Mock for Provider List */}
            <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Pending Approvals List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b bg-slate-50 text-xs font-medium text-muted-foreground flex justify-between">
                    <span>Company Name</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y">
                     <div className="p-4 flex items-center justify-between">
                       <div>
                         <div className="font-medium text-sm">Security Pros Ltd</div>
                         <div className="text-xs text-muted-foreground">Registered: Today</div>
                       </div>
                       <div className="flex items-center gap-2">
                         <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
                         <Button size="icon" variant="ghost" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                       </div>
                     </div>
                      <div className="p-4 flex items-center justify-between bg-slate-50/50">
                       <div className="space-y-2 w-full">
                         <div className="flex justify-between w-full">
                            <span className="text-sm font-medium">Review Documents</span>
                         </div>
                         <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs">Approve</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600">Reject</Button>
                         </div>
                       </div>
                     </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FINANCE TAB */}
        <TabsContent value="finance" className="space-y-6 mt-6">
           <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Finance Overview</h2>
              <p className="text-muted-foreground">
                Manage incoming invoices and issue proformas.
              </p>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="invoice-1">
                  <AccordionTrigger>Approving Invoices</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    Go to the <strong>Invoices</strong> page. Click on any "Pending" invoice to view the PDF. Verify the amount against the timesheets, then click "Approve".
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="invoice-2">
                  <AccordionTrigger>Issuing Proformas</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    You can create a proforma invoice request for a provider. This sends them a notification to generate a bill for a specific amount.
                  </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="invoice-3">
                  <AccordionTrigger>Exporting Data</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    Use the "Export CSV" button on the Invoices list to download a spreadsheet compatible with your accounting software.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Visual Mock for Invoices */}
             <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Invoice Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                   <div className="flex items-center justify-between">
                     <h4 className="font-semibold text-sm">Invoice #INV-2024-001</h4>
                     <Badge variant="outline" className="bg-blue-50 text-blue-700">Pending Review</Badge>
                   </div>
                   <div className="bg-slate-50 p-3 rounded text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <span className="font-medium">Top Tier Security</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Event:</span>
                        <span className="font-medium">Leeds Festival</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-bold">£4,500.00</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="mr-2 h-3 w-3" /> View PDF
                      </Button>
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700">Approve</Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-6 mt-6">
           <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Reporting</h2>
              <p className="text-muted-foreground">
                Generate insights on attendance, costs, and provider performance.
              </p>
              
               <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-default">
                    <BarChart3 className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-medium text-sm">Attendance Trends</h3>
                    <p className="text-xs text-muted-foreground mt-1">Compare planned vs. actual staff numbers.</p>
                  </div>
                  <div className="border rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-default">
                    <Users className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-medium text-sm">Provider Scorecards</h3>
                    <p className="text-xs text-muted-foreground mt-1">Reliability ratings per supplier.</p>
                  </div>
               </div>
            </div>

            {/* Visual Mock for Reports */}
             <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Report Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                   <div className="flex items-center gap-2 border-b pb-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Filter Report Data</span>
                   </div>
                   <div className="space-y-3">
                      <div className="space-y-1">
                         <Label className="text-xs">Date Range</Label>
                         <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="w-full text-xs justify-start font-normal text-muted-foreground">Start Date</Button>
                            <span className="text-muted-foreground">-</span>
                            <Button variant="outline" size="sm" className="w-full text-xs justify-start font-normal text-muted-foreground">End Date</Button>
                         </div>
                      </div>
                      <div className="space-y-1">
                         <Label className="text-xs">Report Type</Label>
                         <Button variant="outline" size="sm" className="w-full justify-between">
                            <span>Event Summary</span>
                            <MoreHorizontal className="h-3 w-3" />
                         </Button>
                      </div>
                   </div>
                   <Button size="sm" className="w-full">Generate Report</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Common Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Common Tasks</CardTitle>
          <CardDescription>Quick guides for everyday tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Create an Event</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a new event with staff requirements and assign providers.
              </p>
              <Link href="/admin/events/new">
                <span className="text-sm text-primary hover:underline">Go to Create Event →</span>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Approve Providers</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Review and approve pending provider onboarding applications.
              </p>
              <Link href="/admin/providers/pending">
                <span className="text-sm text-primary hover:underline">Go to Pending Approvals →</span>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Review Invoices</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Check and approve incoming invoices from providers.
              </p>
              <Link href="/admin/invoices">
                <span className="text-sm text-primary hover:underline">Go to Invoices →</span>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Send Messages</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Communicate with providers in real-time through the messaging system.
              </p>
              <Link href="/admin/messages">
                <span className="text-sm text-primary hover:underline">Go to Messages →</span>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">View Reports</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate custom reports with date ranges and export data.
              </p>
              <Link href="/admin/reports">
                <span className="text-sm text-primary hover:underline">Go to Reports →</span>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Configure Settings</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Manage your notification preferences and account settings.
              </p>
              <Link href="/admin/settings">
                <span className="text-sm text-primary hover:underline">Go to Settings →</span>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle>Keyboard Shortcuts</CardTitle>
          <CardDescription>Speed up your workflow with keyboard shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Focus Search</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  Ctrl + K
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Event</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  Ctrl + Shift + N
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Dashboard</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  Ctrl + D
                </kbd>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Events</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  Ctrl + E
                </kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Go to Messages</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                  Ctrl + M
                </kbd>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

       {/* Support Contact Footer */}
      <Card className="mt-8 bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Need More Help?</h3>
                <p className="text-sm text-muted-foreground">Contact support for additional assistance</p>
              </div>
            </div>
            <div className="flex gap-4">
               <Button variant="outline" asChild>
                  <a href="mailto:david.capener@kssnwltd.co.uk">Email Support</a>
               </Button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Support Contact</h3>
              <p className="text-sm text-muted-foreground">
                Email: <a href="mailto:david.capener@kssnwltd.co.uk" className="text-primary hover:underline">david.capener@kssnwltd.co.uk</a>
              </p>
              <p className="text-sm text-muted-foreground">
                Phone: <a href="tel:07947694353" className="text-primary hover:underline">07947 694 353</a>
              </p>
            </div>
            <div className="mt-4">
              <h3 className="font-semibold mb-2 text-sm">Platform Information</h3>
              <p className="text-sm text-muted-foreground">
                Version: 1.0.0 (Phase 1 - Mock Data)
              </p>
              <p className="text-sm text-muted-foreground">
                For technical issues or feature requests, please contact the development team.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
