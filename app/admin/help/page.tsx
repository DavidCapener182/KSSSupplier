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
  CheckCircle,
  Camera,
  Search,
  QrCode,
  Clock,
  ArrowLeft,
  Edit
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
        <p className="text-gray-600 mt-1">Admin Guide for the KSS NW UK Labour Provider Portal</p>
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
                      <li>Enter event name, location, and start date</li>
                      <li>For multi-day events (e.g., festivals), click "Add End Date" to specify the event duration</li>
                      <li>Specify staff requirements (Managers, Supervisors, SIA, Stewards)</li>
                      <li>For multi-day events, you can set different requirements for each day using the day tabs</li>
                      <li>Save the event</li>
                    </ol>
                    <p className="mt-2"><strong>Multi-Day Events:</strong></p>
                    <p className="ml-2">
                      Events can span multiple days (e.g., festivals). When you add an end date:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>The event date range will display as "Start Date - End Date"</li>
                      <li>Staff requirements can be set per day using tabs (Day 1, Day 2, etc.)</li>
                      <li>When updating staff times, shifts will be labeled by day (e.g., "Day 1 - Jun 18, 2026")</li>
                      <li>The Staff Requirements section shows tabs for each day with required vs. assigned staff</li>
                    </ul>
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
                    <p className="mt-2"><strong>CheckPoint - Live Event Check-In:</strong></p>
                    <p className="ml-2">
                      Use CheckPoint to scan staff in at venue gates during live events:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-4">
                      <li>On the event detail page, click the CheckPoint logo to start live check-in</li>
                      <li>The event status will change from "scheduled" to "active"</li>
                      <li>Use the camera to scan SIA badge barcodes or the front of cards (OCR)</li>
                      <li>Staff are verified against the event's staff list</li>
                      <li>View real-time statistics: staff booked, scanned correctly, duplicates, and rejected</li>
                      <li>Manually check in stewards using the "Steward" tab</li>
                      <li>Recent scans persist and can be edited/deleted</li>
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
                    <p className="mt-2"><strong>Purchase Orders:</strong></p>
                    <p className="ml-2">
                      You can issue purchase order invoices or payment requests directly through the system for specific events.
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
              <AccordionItem value="data-search">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Data Search with KSS Answer</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Natural Language Data Search:</strong></p>
                    <p className="ml-2">
                      Use the Data Search page to query your database using plain English questions.
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Navigate to <strong>Data Search</strong> in the sidebar</li>
                      <li>Type your question in plain English (e.g., "How many times do we have Lewis Capaldi?")</li>
                      <li>Click "Search" to generate results</li>
                      <li>View the <strong>KSS Answer</strong> - an AI-generated natural language explanation of the results</li>
                      <li>Review the generated SQL query that was used</li>
                      <li>See the raw data results in a table format</li>
                    </ol>
                    <p className="mt-2"><strong>KSS Answer:</strong></p>
                    <p className="ml-2">
                      The KSS Answer provides a human-readable explanation of your query results, formatted with HTML for easy reading. It interprets the SQL results and presents them in a clear, natural language format.
                    </p>
                    <p className="mt-2"><strong>Example Queries:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>"Show approved providers in London"</li>
                      <li>"List pending assignments next month"</li>
                      <li>"Count staff by provider for Reading Festival"</li>
                      <li>"How many events do we have in June 2026?"</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="checkpoint">CheckPoint</TabsTrigger>
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

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Multi-Day Events
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Events can span multiple days (e.g., festivals, conferences). When creating or editing an event, you can add an end date to make it a multi-day event.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                    <p><strong>Key Features:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Set different staff requirements for each day</li>
                      <li>View requirements per day using tabs (Day 1, Day 2, etc.)</li>
                      <li>Update staff times with day-specific labels</li>
                      <li>Date range displays as "Start Date - End Date" throughout the system</li>
                    </ul>
                  </div>
                  <p className="text-muted-foreground">
                    <strong>To create a multi-day event:</strong> Click "Add End Date" when creating or editing an event, then set staff requirements for each day using the day tabs.
                  </p>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  CheckPoint - Live Event Check-In
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    CheckPoint is a mobile-optimized live check-in system for scanning staff at venue gates during events. It verifies SIA badges and creates a digital record of attendance.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                    <div>
                      <p className="font-medium mb-1">Starting CheckPoint:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Navigate to the event detail page</li>
                        <li>Click the CheckPoint logo (appears when event is active)</li>
                        <li>Or click "Start Live Event" to activate the event first</li>
                        <li>You'll be redirected to the CheckPoint scanning page</li>
                      </ol>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Scanning Methods:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Barcode Scanning:</strong> Scan the barcode on SIA badges</li>
                        <li><strong>OCR (Optical Character Recognition):</strong> Scan the front of the SIA card to extract the SIA number</li>
                        <li><strong>Manual Entry:</strong> Enter SIA number manually if scanning fails</li>
                        <li><strong>Steward Check-In:</strong> Use the "Steward" tab to manually check in stewards by name and provider</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Scan Results:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Green:</strong> Verified - Staff member is on the event's staff list</li>
                        <li><strong>Red:</strong> Rejected - Staff member is not on the list</li>
                        <li><strong>Amber:</strong> Duplicate - Same badge scanned within 5 minutes</li>
                        <li><strong>Yellow:</strong> Steward - Manually checked in steward</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Statistics & Monitoring:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>View real-time counts: Staff booked, scanned correctly, duplicates, rejected</li>
                        <li>See detailed verified scans with full name, SIA badge number, expiry date, shift times, and provider</li>
                        <li>Recent scans persist and can be edited/deleted</li>
                        <li>All scans (verified, rejected, duplicates) appear in recent scans</li>
                      </ul>
                    </div>
                  </div>
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

        {/* CHECKPOINT TAB */}
        <TabsContent value="checkpoint" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">CheckPoint - Live Event Check-In</h2>
              <p className="text-muted-foreground">
                CheckPoint is a mobile-optimized live check-in system for scanning staff at venue gates during events. It verifies SIA badges and creates a digital record of attendance.
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Getting Started</h3>
                  <ol className="list-decimal list-inside space-y-1 text-sm ml-2">
                    <li>Navigate to an event detail page</li>
                    <li>Click the CheckPoint logo or "Start Live Event" button</li>
                    <li>The event status changes from "scheduled" to "active"</li>
                    <li>You'll be redirected to the CheckPoint scanning page</li>
                    <li>Allow camera permissions when prompted</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Scanning Methods</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <QrCode className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <strong>Barcode Scanning:</strong> Scan the barcode on SIA badges using your device camera
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Camera className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <strong>OCR (Optical Character Recognition):</strong> Scan the front of the SIA card to extract the SIA number automatically
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <strong>Manual Entry:</strong> Enter SIA number manually if scanning fails
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 mt-0.5 text-primary" />
                      <div>
                        <strong>Steward Check-In:</strong> Use the "Steward" tab to manually check in stewards by name and provider
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Scan Results</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span><strong>Green (Verified):</strong> Staff member is on the event's staff list</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span><strong>Red (Rejected):</strong> Staff member is not on the list</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <span><strong>Amber (Duplicate):</strong> Same badge scanned within 5 minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span><strong>Yellow (Steward):</strong> Manually checked in steward</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Features</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                    <li>Real-time statistics: Staff booked, scanned correctly, duplicates, rejected</li>
                    <li>Detailed verified scans with full name, SIA badge number, expiry date, shift times, and provider</li>
                    <li>Recent scans persist and can be edited/deleted</li>
                    <li>Audio feedback for scan results</li>
                    <li>Mobile-optimized layout for use at venue gates</li>
                    <li>Desktop layout with camera/stats on left, recent scans on right</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Visual Mockups */}
            <div className="space-y-4">
              <Card className="bg-slate-50 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: CheckPoint Interface</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Header Mock */}
                  <div className="bg-white rounded-lg border shadow-sm p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4 text-gray-400" />
                      <div className="h-6 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Count: <strong>12</strong></span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        ● LIVE
                      </Badge>
                    </div>
                  </div>

                  {/* Camera Viewport Mock */}
                  <div className="bg-black rounded-lg border-2 border-gray-300 aspect-video flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black"></div>
                    <div className="relative z-10 text-center text-white">
                      <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs opacity-75">Camera View</p>
                    </div>
                    <div className="absolute inset-0 border-2 border-dashed border-white/30 m-8 rounded"></div>
                  </div>

                  {/* Manual Entry Tabs Mock */}
                  <div className="bg-white rounded-lg border shadow-sm p-3">
                    <div className="flex gap-2 mb-3">
                      <Button variant="default" size="sm" className="text-xs flex-1">Manual SIA Entry</Button>
                      <Button variant="outline" size="sm" className="text-xs flex-1">Steward</Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Enter SIA Number Manually</Label>
                      <div className="flex gap-2">
                        <Input placeholder="1017 0487 7704 6490" className="text-xs h-8" />
                        <Button size="sm" className="text-xs h-8">Check In</Button>
                      </div>
                    </div>
                  </div>

                  {/* Result Card Mock - Verified */}
                  <div className="bg-green-100 border-2 border-green-300 rounded-xl p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-green-800 uppercase mb-1">VERIFIED</h3>
                    <p className="text-sm font-mono bg-white/50 px-2 py-1 rounded border mb-1">SIA: 101704877046490</p>
                    <p className="font-semibold">John Smith</p>
                    <p className="text-xs opacity-75">Top Tier Security</p>
                  </div>

                  {/* Statistics Mock */}
                  <div className="bg-white rounded-lg border shadow-sm p-3">
                    <h4 className="text-xs font-semibold mb-2 uppercase tracking-wider">Statistics</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Staff Booked</p>
                        <p className="text-sm font-bold">58</p>
                      </div>
                      <div>
                        <p className="text-gray-500">In Provider Lists</p>
                        <p className="text-sm font-bold">55</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Scanned Correctly</p>
                        <p className="text-sm font-bold text-green-600">42</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duplicates</p>
                        <p className="text-sm font-bold text-amber-600">3</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500">Rejected</p>
                        <p className="text-sm font-bold text-red-600">10</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Scans Mock */}
                  <div className="bg-white rounded-lg border shadow-sm p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium uppercase tracking-wider">Recent Scans</h4>
                      <Button variant="ghost" size="sm" className="h-6 text-xs">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-green-50 border border-green-200 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <p className="font-medium truncate">John Smith</p>
                        </div>
                        <p className="text-xs font-mono text-gray-600 truncate">SIA: 101704877046490</p>
                        <p className="text-xs text-gray-500 truncate">Top Tier Security</p>
                        <p className="text-xs text-gray-400 mt-1">14:32</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <p className="font-medium truncate">Unknown Staff</p>
                        </div>
                        <p className="text-xs font-mono text-gray-600 truncate">SIA: 202112345678901</p>
                        <p className="text-xs text-gray-500 truncate">Not on list</p>
                        <p className="text-xs text-gray-400 mt-1">14:28</p>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <p className="font-medium truncate">Jane Doe</p>
                        </div>
                        <p className="text-xs font-semibold text-yellow-700 truncate">STEWARD</p>
                        <p className="text-xs text-gray-500 truncate">Event Staff Ltd</p>
                        <p className="text-xs text-gray-400 mt-1">14:25</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                          <p className="font-medium truncate">Mike Johnson</p>
                        </div>
                        <p className="text-xs font-mono text-gray-600 truncate">SIA: 101704877046490</p>
                        <p className="text-xs text-gray-500 truncate">Duplicate</p>
                        <p className="text-xs text-gray-400 mt-1">14:20</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verified Check-Ins List Mock */}
              <Card className="bg-slate-50 border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">PREVIEW: Verified Check-Ins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded-lg border shadow-sm p-3 space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2">Verified Check-Ins</h4>
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3 text-xs">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">John Smith</p>
                            <p className="font-mono text-gray-600 mt-1">SIA: 101704877046490</p>
                          </div>
                          <span className="text-gray-400">14:32</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <p className="text-gray-500">Expiry Date</p>
                            <p className="font-medium">18/06/2027</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Shift Time</p>
                            <p className="font-medium">09:00 - 17:00</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-gray-500">Provider</p>
                          <p className="font-medium">Top Tier Security</p>
                        </div>
                      </div>
                      <div className="border rounded-lg p-3 text-xs">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">Sarah Williams</p>
                            <p className="font-mono text-gray-600 mt-1">SIA: 202112345678901</p>
                          </div>
                          <span className="text-gray-400">14:25</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <p className="text-gray-500">Expiry Date</p>
                            <p className="font-medium">15/09/2026</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Shift Time</p>
                            <p className="font-medium">10:00 - 18:00</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <p className="text-gray-500">Provider</p>
                          <p className="font-medium">Event Staff Ltd</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                Manage incoming invoices, issue purchase orders, and track payment status.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Invoice Status Management
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Purchase Order Invoices:</strong> Can be marked as "Paid" using the "Mark Paid" button.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Auto-Status Update:</strong> Purchase order invoices automatically change to "Outstanding" if not marked as paid within 30 days after the event's end date.
                </p>
              </div>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="invoice-1">
                  <AccordionTrigger>Approving Invoices</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    Go to the <strong>Invoices</strong> page. Click on any "Pending" invoice to view the PDF. Verify the amount against the timesheets, then click "Approve".
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="invoice-2">
                  <AccordionTrigger>Issuing Purchase Orders</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    You can create a purchase order invoice request for a provider. This sends them a notification to generate a bill for a specific amount.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="invoice-4">
                  <AccordionTrigger>Marking Purchase Orders as Paid</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    For purchase order invoices, you can mark them as "Paid" using the "Mark Paid" button. This updates the invoice status and helps track payment completion.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="invoice-5">
                  <AccordionTrigger>Outstanding Invoice Status</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm">
                    Purchase order invoices automatically change to "Outstanding" status if they haven't been marked as paid within 30 days after the event's end date. This helps identify invoices that need attention.
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

              <Separator className="my-4" />

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Data Search with KSS Answer
                </h3>
                <p className="text-sm text-muted-foreground">
                  Query your database using natural language and receive AI-powered answers.
                </p>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>How it works:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Type your question in plain English</li>
                    <li>AI generates SQL and executes the query</li>
                    <li>KSS Answer provides a natural language explanation</li>
                    <li>View the generated SQL and raw results</li>
                  </ol>
                  <p className="mt-2"><strong>Example queries:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                    <li>"How many events do we have in June?"</li>
                    <li>"Show all providers in London"</li>
                    <li>"Count staff by provider for Reading Festival"</li>
                  </ul>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Search Your Data</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Use natural language to query your database and get AI-powered answers.
              </p>
              <Link href="/admin/data-search">
                <span className="text-sm text-primary hover:underline">Go to Data Search →</span>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Use CheckPoint</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Start live event check-in to scan staff at venue gates.
              </p>
              <p className="text-xs text-muted-foreground">
                Navigate to an active event and click the CheckPoint logo.
              </p>
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
                Version: 2.0.0 (Production)
              </p>
              <p className="text-sm text-muted-foreground">
                Environment: Production | Data Storage: PostgreSQL (Supabase)
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
