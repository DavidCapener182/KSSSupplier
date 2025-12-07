'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useDataStore } from '@/lib/data-store';
import { EventPncReport } from '@/components/events/EventPncReport';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

export default function PncReportPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const { 
    events, 
    assignments, 
    providers, 
    loadEvents, 
    loadAssignments, 
    loadProviders,
    loadStaffDetails,
    staffDetails
  } = useDataStore();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        await Promise.all([
          loadEvents(),
          loadAssignments(),
          loadProviders(),
        ]);
        
        // Load staff details for all assignments for this event
        const eventAssignments = assignments.filter(a => a.event_id === eventId);
        await Promise.all(eventAssignments.map(a => loadStaffDetails(a.id)));
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading report data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load report data',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [eventId, loadEvents, loadAssignments, loadProviders, loadStaffDetails, assignments, toast]);

  const event = events.find(e => e.id === eventId);

  if (isLoading) {
    return <div className="p-8 text-center">Loading report data...</div>;
  }

  if (!event) {
    return <div className="p-8 text-center text-red-500">Event not found</div>;
  }

  // Filter staff details for this event
  const eventAssignments = assignments.filter(a => a.event_id === eventId);
  const assignmentIds = new Set(eventAssignments.map(a => a.id));
  const eventStaffDetails = staffDetails.filter(s => assignmentIds.has(s.assignment_id));

  return (
    <div className="min-h-screen bg-white">
      {/* No-print controls */}
      <div className="print:hidden bg-slate-100 border-b p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href={`/admin/events/${eventId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Button>
          </Link>
          <span className="font-semibold text-sm">PNC / SIA Report Preview</span>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          Print / Save PDF
        </Button>
      </div>

      {/* Report Content */}
      <EventPncReport 
        event={event}
        assignments={assignments}
        providers={providers}
        staffDetails={eventStaffDetails}
      />
    </div>
  );
}
