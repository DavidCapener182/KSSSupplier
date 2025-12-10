import type { Event, Assignment, Provider, Invoice } from './types';
import { format } from 'date-fns';

export function exportEventsToCSV(events: Event[], assignments: Assignment[], providers: Provider[]) {
  const headers = ['Event Name', 'Date', 'Location', 'Managers Required', 'Supervisors Required', 'SIA Required', 'Stewards Required', 'Status'];
  const rows = events.map((event) => {
    const eventAssignments = assignments.filter((a) => a.event_id === event.id);
    const totalAssigned = eventAssignments.reduce(
      (acc, a) => ({
        managers: acc.managers + a.assigned_managers,
        supervisors: acc.supervisors + a.assigned_supervisors,
        sia: acc.sia + a.assigned_sia,
        stewards: acc.stewards + a.assigned_stewards,
      }),
      { managers: 0, supervisors: 0, sia: 0, stewards: 0 }
    );
    const isFullyStaffed =
      totalAssigned.managers >= event.requirements.managers &&
      totalAssigned.supervisors >= event.requirements.supervisors &&
      totalAssigned.sia >= event.requirements.sia &&
      totalAssigned.stewards >= event.requirements.stewards;

    return [
      event.name,
      format(new Date(event.date), 'yyyy-MM-dd'),
      event.location,
      event.requirements.managers,
      event.requirements.supervisors,
      event.requirements.sia,
      event.requirements.stewards,
      isFullyStaffed ? 'Fully Staffed' : 'Needs Staff',
    ];
  });

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csvContent;
}

export function exportAssignmentsToCSV(
  assignments: Assignment[],
  events: Event[],
  providers: Provider[]
) {
  const headers = [
    'Event Name',
    'Event Date',
    'Provider',
    'Managers',
    'Supervisors',
    'SIA',
    'Stewards',
    'Status',
    'Accepted At',
  ];
  const rows = assignments.map((assignment) => {
    const event = events.find((e) => e.id === assignment.event_id);
    const provider = providers.find((p) => p.id === assignment.provider_id);
    return [
      event?.name || 'Unknown',
      event?.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
      provider?.company_name || 'Unknown',
      assignment.assigned_managers,
      assignment.assigned_supervisors,
      assignment.assigned_sia,
      assignment.assigned_stewards,
      assignment.status,
      assignment.accepted_at ? format(new Date(assignment.accepted_at), 'yyyy-MM-dd HH:mm') : '',
    ];
  });

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csvContent;
}

export function exportInvoicesToCSV(
  invoices: Invoice[],
  events: Event[],
  providers: Provider[]
) {
  const headers = [
    'Invoice ID',
    'Event Name',
    'Event Date',
    'Provider',
    'Amount',
    'Status',
    'Submitted Date',
    'Payment Date',
  ];
  const rows = invoices.map((invoice) => {
    const event = events.find((e) => e.id === invoice.event_id);
    const provider = providers.find((p) => p.id === invoice.provider_id);
    return [
      invoice.id,
      event?.name || 'Unknown',
      event?.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
      provider?.company_name || 'Unknown',
      invoice.amount?.toString() || 'N/A',
      invoice.status,
      invoice.created_at ? format(new Date(invoice.created_at), 'yyyy-MM-dd') : '',
      invoice.payment_date ? format(new Date(invoice.payment_date), 'yyyy-MM-dd') : '',
    ];
  });

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csvContent;
}

export function exportStaffDetailsTemplateCSV() {
  const headers = ['Staff Name', 'Role', 'SIA Number', 'SIA Expiry Date (DD/MM/YYYY)'];
  const exampleRow = ['John Doe', 'SIA', '1234567890123456', '26/02/2026'];
  
  const csvContent = [headers, exampleRow].map((row) => row.join(',')).join('\n');
  return csvContent;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


