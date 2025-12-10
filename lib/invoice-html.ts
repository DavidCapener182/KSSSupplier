import type { Event, Assignment, Provider, StaffTimes } from './types';
import { format } from 'date-fns';
import { extractRatesFromAgreement } from './rate-extractor';

export function generateInvoiceHTML(
  event: Event,
  assignments: Assignment[],
  providers: Provider[],
  staffTimesMap: Map<string, StaffTimes[]>,
  isPurchaseOrder: boolean = false,
  agreementContent?: string
): string {
  // Extract hourly rates from agreement content, or use defaults
  const extractedRates = agreementContent 
    ? extractRatesFromAgreement(agreementContent)
    : {
        sia: 16.00,
        stewards: 14.00,
        managers: 16.00,
        supervisors: 16.00,
      };
  
  const hourlyRates: Record<string, number> = {
    'sia': extractedRates.sia,
    'stewards': extractedRates.stewards,
    'managers': extractedRates.managers,
    'supervisors': extractedRates.supervisors,
  };

  // Define role order: Manager, Supervisor, SIA, Stewards
  const roleOrder = ['managers', 'supervisors', 'sia', 'stewards'];
  const getRoleOrder = (roleType: string): number => {
    const index = roleOrder.indexOf(roleType);
    return index === -1 ? 999 : index; // Unknown roles go to the end
  };
  
  // Map role types to display names
  const getRoleDisplayName = (roleType: string): string => {
    const displayNames: Record<string, string> = {
      'managers': 'Manager',
      'supervisors': 'Supervisor',
      'sia': 'SIA',
      'stewards': 'Stewards',
    };
    return displayNames[roleType] || roleType.charAt(0).toUpperCase() + roleType.slice(1);
  };

  const eventAssignments = assignments.filter((a) => a.event_id === event.id && a.status === 'accepted');
  
  let grandTotal = 0;
  const invoiceRows: string[] = [];

  eventAssignments.forEach((assignment) => {
    const provider = providers.find((p) => p.id === assignment.provider_id);
    if (!provider) return;

    const staffTimes = staffTimesMap.get(assignment.id) || [];
    
    if (staffTimes.length === 0) {
      // If no staff times, calculate based on assigned staff with default 8 hours
      // Order: Manager, Supervisor, SIA, Stewards
      const roles = [
        { type: 'managers', count: assignment.assigned_managers },
        { type: 'supervisors', count: assignment.assigned_supervisors },
        { type: 'sia', count: assignment.assigned_sia },
        { type: 'stewards', count: assignment.assigned_stewards },
      ];

      roles.forEach((role) => {
        if (role.count > 0) {
          const rate = hourlyRates[role.type] || 14.00;
          const hours = 8; // Default 8 hours if no times specified
          const total = role.count * hours * rate;
          grandTotal += total;

          invoiceRows.push(`
            <tr>
              <td>${provider.company_name}</td>
              <td>${getRoleDisplayName(role.type)}</td>
              <td>${role.count}</td>
              <td>1</td>
              <td>08:00-16:00</td>
              <td>${hours}</td>
              <td>£${rate.toFixed(2)}</td>
              <td>£${total.toFixed(2)}</td>
            </tr>
          `);
        }
      });
    } else {
      // Group by shift and role
      const shiftsMap = new Map<number, Map<string, StaffTimes[]>>();
      staffTimes.forEach((time) => {
        const shiftNum = time.shift_number;
        if (!shiftsMap.has(shiftNum)) {
          shiftsMap.set(shiftNum, new Map());
        }
        const roleMap = shiftsMap.get(shiftNum)!;
        if (!roleMap.has(time.role_type)) {
          roleMap.set(time.role_type, []);
        }
        roleMap.get(time.role_type)!.push(time);
      });

      // Sort shifts by shift number
      const sortedShifts = Array.from(shiftsMap.entries()).sort((a, b) => a[0] - b[0]);
      
      sortedShifts.forEach(([shiftNum, roleMap]) => {
        // Sort roles by predefined order: Manager, Supervisor, SIA, Stewards
        const sortedRoles = Array.from(roleMap.entries()).sort((a, b) => 
          getRoleOrder(a[0]) - getRoleOrder(b[0])
        );
        
        sortedRoles.forEach(([roleType, times]) => {
          times.forEach((time) => {
            const startTime = new Date(`2000-01-01T${time.start_time}`);
            const endTime = new Date(`2000-01-01T${time.end_time}`);
            // Handle overnight shifts
            if (endTime < startTime) {
              endTime.setDate(endTime.getDate() + 1);
            }
            const hours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
            const rate = hourlyRates[roleType] || 14.00;
            const total = time.staff_count * hours * rate;
            grandTotal += total;

            invoiceRows.push(`
              <tr>
                <td>${provider.company_name}</td>
                <td>${getRoleDisplayName(roleType)}</td>
                <td>${time.staff_count}</td>
                <td>${shiftNum}</td>
                <td>${time.start_time.substring(0, 5)}-${time.end_time.substring(0, 5)}</td>
                <td>${hours.toFixed(2)}</td>
                <td>£${rate.toFixed(2)}</td>
                <td>£${total.toFixed(2)}</td>
              </tr>
            `);
          });
        });
      });
    }
  });

  const vat = grandTotal * 0.2;
  const totalWithVat = grandTotal + vat;
  const documentNumber = isPurchaseOrder 
    ? `PO-${event.id.substring(0, 8).toUpperCase()}-${format(new Date(), 'yyyyMMdd')}`
    : `INV-${event.id.substring(0, 8).toUpperCase()}-${format(new Date(), 'yyyyMMdd')}`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          color: #333;
          background: white;
          line-height: 1.5;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        .company-name {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1a1a1a;
        }
        .company-details {
          font-size: 11px;
          line-height: 1.8;
          color: #666;
        }
        .title {
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          margin: 30px 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .invoice-info {
          text-align: right;
          margin-bottom: 25px;
          font-size: 11px;
          padding: 10px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        .event-details {
          margin-bottom: 25px;
          font-size: 11px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
        .event-details h3 {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #1a1a1a;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 10px;
        }
        th {
          background-color: #f8f9fa;
          padding: 10px 6px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #ddd;
          color: #333;
        }
        td {
          padding: 8px 6px;
          border-bottom: 1px solid #eee;
        }
        tbody tr:hover {
          background-color: #f9f9f9;
        }
        .totals {
          margin-top: 30px;
          text-align: right;
        }
        .totals table {
          width: auto;
          margin-left: auto;
          margin-right: 0;
          min-width: 250px;
        }
        .totals td {
          padding: 6px 12px;
          border: none;
        }
        .totals td:first-child {
          text-align: right;
          font-weight: bold;
          padding-right: 20px;
        }
        .totals .total-row {
          border-top: 2px solid #333;
          font-weight: bold;
          font-size: 14px;
          background-color: #f8f9fa;
        }
        .payment-terms {
          margin-top: 40px;
          font-size: 10px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
          border-left: 4px solid #333;
        }
        .payment-terms h4 {
          font-weight: bold;
          margin-bottom: 8px;
          color: #1a1a1a;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">KSS NW UK LTD</div>
        <div class="company-details">
          St Peters House, Sliverwell Street, Bolton, BL1 1PP<br>
          VAT Number: 210477341<br>
          Email: info@kssnwltd.co.uk | Tel: 07947 694 353
        </div>
      </div>

      <div class="title">${isPurchaseOrder ? 'PURCHASE ORDER INVOICE' : 'INVOICE'}</div>

      <div class="invoice-info">
        <div><strong>${isPurchaseOrder ? 'Purchase Order' : 'Invoice'} Number:</strong> ${documentNumber}</div>
        <div><strong>Date:</strong> ${format(new Date(), 'dd MMMM yyyy')}</div>
      </div>

      <div class="event-details">
        <h3>Event Details</h3>
        <div><strong>Event Name:</strong> ${event.name}</div>
        <div><strong>Date:</strong> ${format(new Date(event.date), 'dd MMMM yyyy')}</div>
        <div><strong>Location:</strong> ${event.location}</div>
      </div>

      <h3 style="font-size: 12px; font-weight: bold; margin-bottom: 12px; color: #1a1a1a;">Staff Breakdown</h3>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Role</th>
            <th>Count</th>
            <th>Shift</th>
            <th>Time</th>
            <th>Hours</th>
            <th>Rate (£)</th>
            <th>Total (£)</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceRows.join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td>£${grandTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td>VAT (20%):</td>
            <td>£${vat.toFixed(2)}</td>
          </tr>
          <tr class="total-row">
            <td>Total:</td>
            <td>£${totalWithVat.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <div class="payment-terms">
        <h4>Payment Terms:</h4>
        <p>KSS NW UK LTD will make payment to ${providers.length > 0 ? providers[0].company_name : 'the provider'} within 30 days of receiving a valid invoice.</p>
        <p><strong>Important:</strong> Sign-in and sign-out times will be recorded on-site. The final invoice amounts will be based on actual recorded times, which will be updated within 5 days of the event end date. This purchase order is an estimate based on scheduled times and may be adjusted based on actual attendance records.</p>
        <p>Payment will be made to the account details provided by the provider during onboarding.</p>
      </div>
    </body>
    </html>
  `;
}

