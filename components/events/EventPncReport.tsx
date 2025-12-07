import React from 'react';
import { format } from 'date-fns';
import { Event, Assignment, Provider, StaffDetail } from '@/lib/types';

interface EventPncReportProps {
  event: Event;
  assignments: Assignment[];
  providers: Provider[];
  staffDetails: StaffDetail[];
}

export const EventPncReport: React.FC<EventPncReportProps> = ({
  event,
  assignments,
  providers,
  staffDetails,
}) => {
  // Filter assignments for this event
  const eventAssignments = assignments.filter((a) => a.event_id === event.id);

  // Group staff details by assignment
  const staffByAssignment = eventAssignments.reduce<Record<string, StaffDetail[]>>((acc, assignment) => {
    acc[assignment.id] = staffDetails.filter((s) => s.assignment_id === assignment.id);
    return acc;
  }, {});

  // Calculate overall totals
  const totalReq = {
    managers: event.requirements.managers,
    supervisors: event.requirements.supervisors,
    sia: event.requirements.sia,
    stewards: event.requirements.stewards,
  };

  const totalAssigned = eventAssignments.reduce(
    (acc, a) => ({
      managers: acc.managers + a.assigned_managers,
      supervisors: acc.supervisors + a.assigned_supervisors,
      sia: acc.sia + a.assigned_sia,
      stewards: acc.stewards + a.assigned_stewards,
    }),
    { managers: 0, supervisors: 0, sia: 0, stewards: 0 }
  );

  return (
    <div className="mx-auto max-w-[800px] p-6 text-sm text-slate-900 print:p-0 print:bg-white print:text-black">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Text-based logo as per requirement */}
          <div className="font-bold text-xl tracking-tight text-slate-900">
            KSS NW UK
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">PNC / SIA Staff Details</p>
          <p className="font-semibold text-lg">{event.name}</p>
          <p className="text-xs text-slate-500">
            Generated on {format(new Date(), "dd MMM yyyy HH:mm")}
          </p>
        </div>
      </header>

      {/* Event Information */}
      <section className="mb-8">
        <h2 className="text-base font-bold mb-3 border-b border-slate-200 pb-1">Event Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500 block text-xs">Event Name</span>
            <span className="font-medium">{event.name}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Date</span>
            <span className="font-medium">{format(new Date(event.date), "EEEE, dd MMMM yyyy")}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Location</span>
            <span className="font-medium">{event.location}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">Event ID</span>
            <span className="font-mono text-xs">{event.id.substring(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </section>

      {/* Overall Staff Requirements */}
      <section className="mb-8">
        <h2 className="text-base font-bold mb-3 border-b border-slate-200 pb-1">Staff Requirements – Overall</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded border border-slate-100 print:border-slate-300">
            <span className="block text-xs text-slate-500 mb-1">Managers</span>
            <span className="block font-semibold">
              {totalAssigned.managers} <span className="text-slate-400 font-normal">/ {totalReq.managers}</span>
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-100 print:border-slate-300">
            <span className="block text-xs text-slate-500 mb-1">Supervisors</span>
            <span className="block font-semibold">
              {totalAssigned.supervisors} <span className="text-slate-400 font-normal">/ {totalReq.supervisors}</span>
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-100 print:border-slate-300">
            <span className="block text-xs text-slate-500 mb-1">SIA Licensed</span>
            <span className="block font-semibold">
              {totalAssigned.sia} <span className="text-slate-400 font-normal">/ {totalReq.sia}</span>
            </span>
          </div>
          <div className="bg-slate-50 p-3 rounded border border-slate-100 print:border-slate-300">
            <span className="block text-xs text-slate-500 mb-1">Stewards</span>
            <span className="block font-semibold">
              {totalAssigned.stewards} <span className="text-slate-400 font-normal">/ {totalReq.stewards}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Per-Provider Sections */}
      <div className="space-y-8">
        {eventAssignments.map((assignment) => {
          const provider = providers.find((p) => p.id === assignment.provider_id);
          const staff = staffByAssignment[assignment.id] || [];

          if (!provider) return null;

          return (
            <section key={assignment.id} className="break-inside-avoid-page mt-8 pt-4 border-t-2 border-slate-100 print:border-slate-300">
              {/* Provider Header */}
              <div className="mb-4">
                <h2 className="text-lg font-bold">{provider.company_name}</h2>
                <div className="text-xs text-slate-600 mt-1">
                  {provider.contact_email} {provider.contact_phone && ` • ${provider.contact_phone}`}
                </div>
              </div>

              {/* Provider Requirements */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
                <div className="p-2 border rounded bg-slate-50 print:bg-transparent print:border-slate-300">
                  <span className="text-slate-500">Managers:</span>{' '}
                  <span className="font-semibold">{assignment.assigned_managers}</span>
                </div>
                <div className="p-2 border rounded bg-slate-50 print:bg-transparent print:border-slate-300">
                  <span className="text-slate-500">Supervisors:</span>{' '}
                  <span className="font-semibold">{assignment.assigned_supervisors}</span>
                </div>
                <div className="p-2 border rounded bg-slate-50 print:bg-transparent print:border-slate-300">
                  <span className="text-slate-500">SIA:</span>{' '}
                  <span className="font-semibold">{assignment.assigned_sia}</span>
                </div>
                <div className="p-2 border rounded bg-slate-50 print:bg-transparent print:border-slate-300">
                  <span className="text-slate-500">Stewards:</span>{' '}
                  <span className="font-semibold">{assignment.assigned_stewards}</span>
                </div>
              </div>

              {/* Staff Table */}
              {staff.length > 0 ? (
                <div className="overflow-hidden border border-slate-200 rounded">
                  <table className="min-w-full text-xs">
                    <thead className="bg-slate-50 print:bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 w-10">#</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 w-1/4">Name</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 w-1/6">Role</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700 w-1/4">SIA Number</th>
                        <th className="px-3 py-2 text-left font-semibold text-slate-700">PNC Info / Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {staff.map((s, idx) => (
                        <tr key={s.id} className={idx % 2 === 1 ? 'bg-slate-50 print:bg-transparent' : ''}>
                          <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{s.staff_name}</td>
                          <td className="px-3 py-2 text-slate-700">
                            {s.role ? (
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium
                                ${s.role === 'Manager' ? 'bg-purple-100 text-purple-800 print:bg-transparent print:text-black print:border print:border-black' : ''}
                                ${s.role === 'Supervisor' ? 'bg-blue-100 text-blue-800 print:bg-transparent print:text-black print:border print:border-black' : ''}
                                ${s.role === 'SIA' ? 'bg-amber-100 text-amber-800 print:bg-transparent print:text-black print:border print:border-black' : ''}
                                ${s.role === 'Steward' ? 'bg-green-100 text-green-800 print:bg-transparent print:text-black print:border print:border-black' : ''}
                              `}>
                                {s.role}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-600">{s.sia_number || '-'}</td>
                          <td className="px-3 py-2 text-slate-600 break-words">{s.pnc_info || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center border border-slate-200 rounded bg-slate-50 print:bg-white text-slate-500 italic text-xs">
                  No PNC / SIA details uploaded for this provider for this event.
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t text-[10px] text-slate-400 flex justify-between print:fixed print:bottom-0 print:left-0 print:right-0 print:px-6 print:pb-4 print:bg-white">
        <div>Confidential – For operational and law-enforcement use only</div>
        <div>KSS NW UK</div>
      </footer>
    </div>
  );
};
