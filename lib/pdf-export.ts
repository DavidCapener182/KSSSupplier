import jsPDF from 'jspdf';
import type { Event, Assignment, Provider, StaffDetail } from './types';
import { format } from 'date-fns';
import { extractRatesFromAgreement } from './rate-extractor';
import { EventSuccessReportData } from './ai/post-event-report-generator';

export function generateEventSuccessReportPDF(data: EventSuccessReportData): Blob {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text('Event Success Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(`${data.eventName}`, pageWidth / 2, 30, { align: 'center' });
  doc.text(`Date: ${format(new Date(data.date), 'MMMM dd, yyyy')}`, pageWidth / 2, 38, { align: 'center' });
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 45, pageWidth - 20, 45);
  
  // Executive Summary (Narrative)
  let y = 55;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Executive Summary', 20, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const narrativeLines = doc.splitTextToSize(data.narrative, pageWidth - 40);
  doc.text(narrativeLines, 20, y);
  y += narrativeLines.length * 6 + 10;
  
  // Metrics Grid
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Performance Metrics', 20, y);
  y += 10;
  
  const boxWidth = (pageWidth - 50) / 3;
  const boxHeight = 25;
  
  // Box 1: Attendance
  doc.setFillColor(240, 248, 255);
  doc.rect(20, y, boxWidth, boxHeight, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Attendance Rate', 20 + boxWidth / 2, y + 8, { align: 'center' });
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.metrics.attendanceRate.toFixed(1)}%`, 20 + boxWidth / 2, y + 18, { align: 'center' });
  
  // Box 2: Total Cost
  doc.setFillColor(240, 255, 240);
  doc.rect(20 + boxWidth + 5, y, boxWidth, boxHeight, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Cost', 20 + boxWidth + 5 + boxWidth / 2, y + 8, { align: 'center' });
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`£${data.metrics.totalCost.toLocaleString()}`, 20 + boxWidth + 5 + boxWidth / 2, y + 18, { align: 'center' });
  
  // Box 3: Issues
  doc.setFillColor(255, 240, 240);
  doc.rect(20 + (boxWidth + 5) * 2, y, boxWidth, boxHeight, 'F');
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Issues Reported', 20 + (boxWidth + 5) * 2 + boxWidth / 2, y + 8, { align: 'center' });
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`${data.metrics.issueCount}`, 20 + (boxWidth + 5) * 2 + boxWidth / 2, y + 18, { align: 'center' });
  
  y += boxHeight + 15;
  
  // Detailed Financials
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Financial Overview', 20, y);
  y += 10;
  
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Total Budget: £${data.metrics.budget.toLocaleString()}`, 20, y);
  y += 7;
  doc.text(`Actual Cost: £${data.metrics.totalCost.toLocaleString()}`, 20, y);
  y += 7;
  
  const varianceColor = data.metrics.variance > 0 ? [200, 0, 0] : [0, 150, 0];
  doc.setTextColor(varianceColor[0], varianceColor[1], varianceColor[2]);
  doc.text(`Variance: ${data.metrics.variance > 0 ? '+' : ''}£${data.metrics.variance.toLocaleString()}`, 20, y);
  
  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
  
  return doc.output('blob');
}

export function generateEventSummaryPDF(
  event: Event,
  assignments: Assignment[],
  providers: Provider[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Summary Report', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Event Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Details', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Event Name: ${event.name}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Location: ${event.location}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Date: ${format(new Date(event.date), 'MMMM dd, yyyy')}`, 20, yPosition);
  yPosition += 10;

  // Staff Requirements
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff Requirements', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Managers: ${event.requirements.managers}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Supervisors: ${event.requirements.supervisors}`, 20, yPosition);
  yPosition += 6;
  doc.text(`SIA Licensed: ${event.requirements.sia}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Stewards: ${event.requirements.stewards}`, 20, yPosition);
  yPosition += 10;

  // Assignments
  const eventAssignments = assignments.filter((a) => a.event_id === event.id);
  if (eventAssignments.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Provider Assignments', 20, yPosition);
    yPosition += 8;

    eventAssignments.forEach((assignment, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      const provider = providers.find((p) => p.id === assignment.provider_id);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${provider?.company_name || 'Unknown Provider'}`, 20, yPosition);
      yPosition += 6;

      doc.setFont('helvetica', 'normal');
      doc.text(`Status: ${assignment.status}`, 25, yPosition);
      yPosition += 6;
      doc.text(
        `Assigned: ${assignment.assigned_managers} Managers, ${assignment.assigned_supervisors} Supervisors, ${assignment.assigned_sia} SIA, ${assignment.assigned_stewards} Stewards`,
        25,
        yPosition
      );
      yPosition += 6;

      if (assignment.actual_managers !== null) {
        doc.text(
          `Actual: ${assignment.actual_managers} Managers, ${assignment.actual_supervisors} Supervisors, ${assignment.actual_sia} SIA, ${assignment.actual_stewards} Stewards`,
          25,
          yPosition
        );
        yPosition += 6;

        const totalAssigned =
          assignment.assigned_managers +
          assignment.assigned_supervisors +
          assignment.assigned_sia +
          assignment.assigned_stewards;
        const totalActual =
          (assignment.actual_managers || 0) +
          (assignment.actual_supervisors || 0) +
          (assignment.actual_sia || 0) +
          (assignment.actual_stewards || 0);
        const attendanceRate =
          totalAssigned > 0 ? ((totalActual / totalAssigned) * 100).toFixed(1) : '0';

        doc.text(`Attendance Rate: ${attendanceRate}%`, 25, yPosition);
        yPosition += 6;
      }

      yPosition += 4;
    });
  }

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      `Generated on ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`event-summary-${event.name.replace(/\s+/g, '-')}-${format(new Date(event.date), 'yyyy-MM-dd')}.pdf`);
}

export function generatePncSiaPDF(
  event: Event,
  assignments: Assignment[],
  providers: Provider[],
  staffDetails: StaffDetail[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Helper to add a page if we're near the bottom
  const checkPageBreak = (neededSpace: number) => {
    if (yPosition + neededSpace > pageHeight - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Header Function
  const addHeader = () => {
    // Header with Text Logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KSS NW UK', 20, yPosition);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('PNC / SIA Staff Details', pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 6;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(event.name, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${format(new Date(), "dd MMM yyyy HH:mm")}`, pageWidth - 20, yPosition, { align: 'right' });
    
    yPosition += 10;
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;
    doc.setTextColor(0, 0, 0);
  };

  addHeader();

  // Event Information
  checkPageBreak(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Information', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Event Name: ${event.name}`, 20, yPosition);
  doc.text(`Date: ${format(new Date(event.date), "EEEE, dd MMMM yyyy")}`, pageWidth / 2, yPosition);
  yPosition += 6;
  doc.text(`Location: ${event.location}`, 20, yPosition);
  doc.text(`Event ID: ${event.id.substring(0, 8).toUpperCase()}`, pageWidth / 2, yPosition);
  yPosition += 10;

  // Overall Requirements
  checkPageBreak(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff Requirements – Overall', 20, yPosition);
  yPosition += 8;

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

  // Draw simple grid for requirements
  const colWidth = (pageWidth - 40) / 4;
  const boxHeight = 20;
  
  // Managers
  doc.rect(20, yPosition, colWidth - 2, boxHeight);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Managers', 22, yPosition + 5);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`${totalAssigned.managers} / ${event.requirements.managers}`, 22, yPosition + 15);

  // Supervisors
  doc.rect(20 + colWidth, yPosition, colWidth - 2, boxHeight);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Supervisors', 22 + colWidth, yPosition + 5);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`${totalAssigned.supervisors} / ${event.requirements.supervisors}`, 22 + colWidth, yPosition + 15);

  // SIA
  doc.rect(20 + colWidth * 2, yPosition, colWidth - 2, boxHeight);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('SIA Licensed', 22 + colWidth * 2, yPosition + 5);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`${totalAssigned.sia} / ${event.requirements.sia}`, 22 + colWidth * 2, yPosition + 15);

  // Stewards
  doc.rect(20 + colWidth * 3, yPosition, colWidth - 2, boxHeight);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Stewards', 22 + colWidth * 3, yPosition + 5);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`${totalAssigned.stewards} / ${event.requirements.stewards}`, 22 + colWidth * 3, yPosition + 15);

  yPosition += boxHeight + 15;

  // Per Provider Sections
  eventAssignments.forEach((assignment) => {
    const provider = providers.find((p) => p.id === assignment.provider_id);
    if (!provider) return;
    
    const staff = staffDetails.filter((s) => s.assignment_id === assignment.id);
    
    checkPageBreak(60); // Check if we have space for header + requirements + table header

    // Provider Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(provider.company_name, 20, yPosition);
    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const contactInfo = [provider.contact_email, provider.contact_phone].filter(Boolean).join(' • ');
    doc.text(contactInfo, 20, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 8;

    // Provider Requirements (Inline Text)
    doc.setFontSize(9);
    doc.text(`Requirements: Managers: ${assignment.assigned_managers}, Supervisors: ${assignment.assigned_supervisors}, SIA: ${assignment.assigned_sia}, Stewards: ${assignment.assigned_stewards}`, 20, yPosition);
    yPosition += 8;

    // Staff Table
    if (staff.length > 0) {
      // Table Header
      checkPageBreak(20);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition, pageWidth - 40, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      const col1 = 25;  // #
      const col2 = 40;  // Name
      const col3 = 90;  // Role
      const col4 = 120; // SIA
      const col5 = 150; // PNC Info
      
      doc.text('#', col1, yPosition + 5);
      doc.text('Name', col2, yPosition + 5);
      doc.text('Role', col3, yPosition + 5);
      doc.text('SIA Number', col4, yPosition + 5);
      doc.text('PNC Info / Contact', col5, yPosition + 5);
      yPosition += 10;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      staff.forEach((s, idx) => {
        checkPageBreak(15); // Ensure space for row
        
        // Stripe background
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 250);
          doc.rect(20, yPosition - 3, pageWidth - 40, 8, 'F');
        }

        doc.text((idx + 1).toString(), col1, yPosition + 2);
        doc.text(s.staff_name, col2, yPosition + 2);
        doc.text(s.role || '-', col3, yPosition + 2);
        doc.text(s.sia_number || '-', col4, yPosition + 2);
        
        // Handle long PNC info with text wrapping
        const pncText = s.pnc_info || '-';
        const splitPnc = doc.splitTextToSize(pncText, pageWidth - col5 - 25);
        doc.text(splitPnc, col5, yPosition + 2);
        
        // Adjust yPosition based on text height
        const lineHeight = splitPnc.length * 4;
        yPosition += Math.max(6, lineHeight) + 2;
      });
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('No PNC / SIA details uploaded for this provider.', 20, yPosition);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      yPosition += 10;
    }
    
    yPosition += 10; // Space between providers
  });

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Confidential – For operational and law-enforcement use only', 20, pageHeight - 10);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  }

  // Save the PDF
  doc.save(`pnc-report-${event.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export function generateInvoicePDF(
  event: Event,
  assignments: Assignment[],
  providers: Provider[],
  staffTimesMap: Map<string, any[]>,
  isPurchaseOrder: boolean = false,
  agreementContent?: string
): void {
  const doc = buildInvoicePDF(event, assignments, providers, staffTimesMap, isPurchaseOrder, agreementContent);
  
  // Save the PDF
  const filename = isPurchaseOrder
    ? `purchase-order-${event.name.replace(/\s+/g, '-')}-${format(new Date(event.date), 'yyyy-MM-dd')}.pdf`
    : `invoice-${event.name.replace(/\s+/g, '-')}-${format(new Date(event.date), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}

export function generateInvoicePDFDataURL(
  event: Event,
  assignments: Assignment[],
  providers: Provider[],
  staffTimesMap: Map<string, any[]>,
  isPurchaseOrder: boolean = false,
  agreementContent?: string
): string {
  const doc = buildInvoicePDF(event, assignments, providers, staffTimesMap, isPurchaseOrder, agreementContent);
  return doc.output('dataurlstring');
}

function buildInvoicePDF(
  event: Event,
  assignments: Assignment[],
  providers: Provider[],
  staffTimesMap: Map<string, any[]>,
  isPurchaseOrder: boolean = false,
  agreementContent?: string
): any {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // KSS Header with Logo Placeholder and Address
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('KSS NW UK LTD', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('St Peters House, Sliverwell Street, Bolton, BL1 1PP', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('VAT Number: 210477341', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 5;
  doc.text('Email: info@kssnwltd.co.uk | Tel: 07947 694 353', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Invoice/Purchase Order Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(isPurchaseOrder ? 'PURCHASE ORDER INVOICE' : 'INVOICE', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // Invoice/Purchase Order Number and Date
  const documentNumber = isPurchaseOrder 
    ? `PO-${event.id.substring(0, 8).toUpperCase()}-${format(new Date(), 'yyyyMMdd')}`
    : `INV-${event.id.substring(0, 8).toUpperCase()}-${format(new Date(), 'yyyyMMdd')}`;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${isPurchaseOrder ? 'Purchase Order' : 'Invoice'} Number: ${documentNumber}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 6;
  doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, pageWidth - 20, yPosition, { align: 'right' });
  yPosition += 10;

  // Event Details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Details', 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Event Name: ${event.name}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Date: ${format(new Date(event.date), 'dd MMMM yyyy')}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Location: ${event.location}`, 20, yPosition);
  yPosition += 10;

  // Staff Breakdown Table Header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Staff Breakdown', 20, yPosition);
  yPosition += 8;

  // Table Headers
  const tableStartY = yPosition;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Provider', 20, yPosition);
  doc.text('Role', 60, yPosition);
  doc.text('Count', 100, yPosition);
  doc.text('Shift', 130, yPosition);
  doc.text('Time', 160, yPosition);
  doc.text('Hours', 190, yPosition);
  doc.text('Rate (£)', 220, yPosition);
  doc.text('Total (£)', 250, yPosition);
  yPosition += 6;

  // Draw line under header
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 5;

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

  let grandTotal = 0;
  const eventAssignments = assignments.filter((a) => a.event_id === event.id && a.status === 'accepted');

  eventAssignments.forEach((assignment) => {
    const provider = providers.find((p) => p.id === assignment.provider_id);
    if (!provider) return;

    const staffTimes = staffTimesMap.get(assignment.id) || [];
    
    // If no staff times, calculate based on assigned staff with default 8 hours
    // Order: Manager, Supervisor, SIA, Stewards
    if (staffTimes.length === 0) {
      const roles = [
        { type: 'managers', count: assignment.assigned_managers },
        { type: 'supervisors', count: assignment.assigned_supervisors },
        { type: 'sia', count: assignment.assigned_sia },
        { type: 'stewards', count: assignment.assigned_stewards },
      ];

      roles.forEach((role) => {
        if (role.count > 0) {
          // Check if we need a new page
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = 20;
          }

          const rate = hourlyRates[role.type] || 14.00;
          const hours = 8; // Default 8 hours if no times specified
          const total = role.count * hours * rate;
          grandTotal += total;

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          // Truncate provider name if too long to fit in column
          const providerName = provider.company_name.length > 20 ? provider.company_name.substring(0, 17) + '...' : provider.company_name;
          doc.text(providerName, 20, yPosition);
          doc.text(getRoleDisplayName(role.type), 60, yPosition);
          doc.text(role.count.toString(), 100, yPosition);
          doc.text('1', 130, yPosition);
          doc.text('08:00-16:00', 160, yPosition);
          doc.text(hours.toString(), 190, yPosition);
          doc.text(`£${rate.toFixed(2)}`, 220, yPosition);
          doc.text(`£${total.toFixed(2)}`, 250, yPosition);
          yPosition += 6;
        }
      });
    } else {
      // Group by shift and role
      const shiftsMap = new Map<number, Map<string, any[]>>();
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
            // Check if we need a new page
            if (yPosition > pageHeight - 30) {
              doc.addPage();
              yPosition = 20;
            }

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

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            // Truncate provider name if too long to fit in column
            const providerName = provider.company_name.length > 20 ? provider.company_name.substring(0, 17) + '...' : provider.company_name;
            doc.text(providerName, 20, yPosition);
            doc.text(getRoleDisplayName(roleType), 60, yPosition);
            doc.text(time.staff_count.toString(), 100, yPosition);
            doc.text(shiftNum.toString(), 130, yPosition);
            doc.text(
              `${time.start_time.substring(0, 5)}-${time.end_time.substring(0, 5)}`,
              160,
              yPosition
            );
            doc.text(hours.toFixed(2), 190, yPosition);
            doc.text(`£${rate.toFixed(2)}`, 220, yPosition);
            doc.text(`£${total.toFixed(2)}`, 250, yPosition);
            yPosition += 6;
          });
        });
      });
    }
  });

  // Total Section
  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 220, yPosition);
  doc.text(`£${grandTotal.toFixed(2)}`, 250, yPosition);
  yPosition += 6;

  // VAT (20%)
  const vat = grandTotal * 0.2;
  doc.text('VAT (20%):', 220, yPosition);
  doc.text(`£${vat.toFixed(2)}`, 250, yPosition);
  yPosition += 6;

  doc.setLineWidth(0.5);
  doc.line(220, yPosition, pageWidth - 20, yPosition);
  yPosition += 6;

  const totalWithVat = grandTotal + vat;
  doc.setFontSize(12);
  doc.text('Total:', 220, yPosition);
  doc.text(`£${totalWithVat.toFixed(2)}`, 250, yPosition);

  // Payment Terms
  yPosition += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Terms:', 20, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  const providerName = providers.length > 0 ? providers[0].company_name : 'the provider';
  doc.text(`KSS NW UK LTD will make payment to ${providerName} within 30 days of receiving a valid invoice.`, 20, yPosition, { maxWidth: pageWidth - 40 });
  yPosition += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Important:', 20, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  doc.text('Sign-in and sign-out times will be recorded on-site. The final invoice amounts will be based on', 20, yPosition, { maxWidth: pageWidth - 40 });
  yPosition += 6;
  doc.text('actual recorded times, which will be updated within 5 days of the event end date. This purchase order', 20, yPosition, { maxWidth: pageWidth - 40 });
  yPosition += 6;
  doc.text('is an estimate based on scheduled times and may be adjusted based on actual attendance records.', 20, yPosition, { maxWidth: pageWidth - 40 });
  yPosition += 8;
  doc.text('Payment will be made to the account details provided by the provider during onboarding.', 20, yPosition, { maxWidth: pageWidth - 40 });

  // Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Return the doc object (don't save here - let the caller decide)
  return doc;
}


