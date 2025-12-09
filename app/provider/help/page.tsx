'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  CheckCircle,
  FileCheck,
  Clock,
  AlertCircle,
  ChevronRight,
  Upload,
  Search,
  MapPin,
  Clock3
} from 'lucide-react';
import Link from 'next/link';

export default function ProviderHelpPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Help' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold">Help & Documentation</h1>
        <p className="text-gray-600 mt-1">Visual guides for Labour Providers using the KSS Portal</p>
      </div>

      <Tabs defaultValue="onboarding" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        {/* ONBOARDING TAB */}
        <TabsContent value="onboarding" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Getting Verified</h2>
              <p className="text-muted-foreground">
                Before you can accept any work, you must complete the onboarding process. 
                This involves signing two key documents.
              </p>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Navigate to Onboarding</h3>
                    <p className="text-sm text-muted-foreground">Find the "Onboarding" link in the sidebar or check your Dashboard for alerts.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Sign Documents</h3>
                    <p className="text-sm text-muted-foreground">Review and digitally sign the Contractor Agreement and NDA.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                  <div className="space-y-2">
                    <h3 className="font-medium">Wait for Approval</h3>
                    <p className="text-sm text-muted-foreground">An admin will review your profile. You'll be notified via email.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Mock for Onboarding */}
            <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Onboarding Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        Contractor Agreement
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Signed</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Completed on Dec 12, 2024</p>
                    </div>
                    <Button variant="ghost" size="sm" disabled>View</Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        Non-Disclosure Agreement
                        <Badge variant="secondary">Required</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Please review and sign</p>
                    </div>
                    <Button size="sm">Sign Now</Button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded-md border border-yellow-100">
                  <Clock className="h-4 w-4" />
                  <span>Account Status: Pending Approval</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="space-y-6 mt-6">
           <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Managing Assignments</h2>
              <p className="text-muted-foreground">
                You will receive assignment requests for specific events. You need to accept these and then assign your staff.
              </p>

               <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="step-1">
                  <AccordionTrigger>1. Accept the Assignment</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    Go to the <strong>Events</strong> page. Look for "Pending" items. Click "Accept" to confirm you can supply staff.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="step-2">
                  <AccordionTrigger>2. Add Staff Details</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    Open the event details. Use the "Staff" tab to enter names and SIA numbers for the required roles (Managers, Stewards, etc.).
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Visual Mock for Assignments */}
            <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Assignment Request</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                   <div className="p-4 border-b bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">Glastonbury Festival 2025</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" /> Worthy Farm
                          <Separator orientation="vertical" className="h-3" />
                          <Calendar className="h-3 w-3" /> June 25-29, 2025
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Action Required</Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-2 bg-slate-50 rounded border">
                        <span className="block text-muted-foreground text-xs">SIA Security</span>
                        <span className="font-medium text-lg">15</span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border">
                         <span className="block text-muted-foreground text-xs">Stewards</span>
                        <span className="font-medium text-lg">30</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="w-full bg-green-600 hover:bg-green-700">Accept Assignment</Button>
                      <Button variant="outline" className="w-full text-red-600 hover:bg-red-50 border-red-200">Decline</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TIMESHEETS TAB */}
        <TabsContent value="timesheets" className="space-y-6 mt-6">
           <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Submitting Timesheets</h2>
              <p className="text-muted-foreground">
                Accurate timesheets ensure you get paid on time.
              </p>
              
               <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <h3 className="font-semibold mb-4">Process Checklist</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Wait for the event to finish</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Collect sign-in/out sheets from staff</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Enter actual hours in the portal</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Click "Submit Timesheet" for approval</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Visual Mock for Timesheets */}
            <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Timesheet Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Shift 1 - Saturday</h4>
                    <span className="text-xs text-muted-foreground">12 Staff</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-1">
                       <span>Role</span>
                       <span>Start Time</span>
                       <span>End Time</span>
                    </div>
                    {/* Mock Row 1 */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="text-sm font-medium">Supervisor</div>
                      <div className="relative">
                        <Clock3 className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" defaultValue="09:00" />
                      </div>
                      <div className="relative">
                        <Clock3 className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" defaultValue="18:00" />
                      </div>
                    </div>
                     {/* Mock Row 2 */}
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <div className="text-sm font-medium">Steward</div>
                      <div className="relative">
                        <Clock3 className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" defaultValue="10:00" />
                      </div>
                      <div className="relative">
                        <Clock3 className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                        <Input className="h-8 pl-6 text-xs" defaultValue="20:00" />
                      </div>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-end">
                    <Button size="sm">Submit Timesheet</Button>
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
              <h2 className="text-2xl font-semibold tracking-tight">Invoicing</h2>
              <p className="text-muted-foreground">
                Upload your invoices directly to the portal for faster processing.
              </p>
               <ol className="relative border-l border-muted ml-3 space-y-6">
                  <li className="mb-10 ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs ring-4 ring-background">1</span>
                    <h3 className="font-medium leading-tight">Prepare Invoice</h3>
                    <p className="text-sm text-muted-foreground">Create your invoice as a PDF, referencing the Event Name and Date.</p>
                  </li>
                  <li className="mb-10 ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs ring-4 ring-background">2</span>
                    <h3 className="font-medium leading-tight">Upload to Portal</h3>
                    <p className="text-sm text-muted-foreground">Go to <strong>Invoices</strong>, click "Upload", select the event, and attach your file.</p>
                  </li>
                  <li className="ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs ring-4 ring-background">3</span>
                    <h3 className="font-medium leading-tight">Get Paid</h3>
                    <p className="text-sm text-muted-foreground">Track status from "Pending" to "Approved" to "Paid".</p>
                  </li>
                </ol>
            </div>

            {/* Visual Mock for Invoices */}
             <Card className="bg-slate-50 border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Invoice Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg border shadow-sm p-6 space-y-4">
                   <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
                      <div className="p-3 bg-slate-100 rounded-full mb-2">
                        <Upload className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="text-sm font-medium">Drag and drop your invoice here</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF or DOCX up to 10MB</p>
                      <Button variant="secondary" size="sm" className="mt-3">Choose File</Button>
                   </div>
                   
                   <div className="space-y-2">
                      <Label className="text-xs">Select Event</Label>
                      <div className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-muted-foreground">
                        Select an event...
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-xs">Invoice Amount (£)</Label>
                       <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-8" placeholder="0.00" />
                      </div>
                   </div>
                   
                   <Button className="w-full">Upload Invoice</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Support Contact Footer */}
      <Card className="mt-8 bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Still stuck?</h3>
                <p className="text-sm text-muted-foreground">Our support team is available Mon-Fri, 9am-5pm.</p>
              </div>
            </div>
            <div className="flex gap-4">
               <Button variant="outline" asChild>
                  <a href="mailto:david.capener@kssnwltd.co.uk">Email Support</a>
               </Button>
               <Button asChild>
                  <a href="tel:07947694353">Call Support</a>
               </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

