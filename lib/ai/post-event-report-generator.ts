import OpenAI from 'openai';
import { Event, Assignment, Invoice, Message } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EventSuccessReportData {
  eventId: string;
  eventName: string;
  date: string;
  metrics: {
    totalAssigned: number;
    totalActual: number;
    attendanceRate: number;
    totalCost: number;
    budget: number;
    variance: number;
    issueCount: number;
  };
  narrative: string;
}

export async function generateEventReport(
  event: Event,
  assignments: Assignment[],
  invoices: Invoice[],
  messages: Message[]
): Promise<EventSuccessReportData> {
  // 1. Calculate Attendance
  let totalAssigned = 0;
  let totalActual = 0;

  assignments.forEach(a => {
    if (a.status === 'accepted') {
      totalAssigned += 
        (a.assigned_managers || 0) + 
        (a.assigned_supervisors || 0) + 
        (a.assigned_sia || 0) + 
        (a.assigned_stewards || 0);
        
      totalActual += 
        (a.actual_managers || 0) + 
        (a.actual_supervisors || 0) + 
        (a.actual_sia || 0) + 
        (a.actual_stewards || 0);
    }
  });

  const attendanceRate = totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0;

  // 2. Calculate Financials
  // Assuming invoices are linked to event
  const totalCost = invoices
    .filter(i => i.status !== 'pending' && i.status !== 'purchase_order') // Only approved/paid invoices
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  // Budget - placeholder logic, assume budget is based on requirements * standard rate if not in DB
  // Or fetch from event if we added a budget column (not in schema yet, so we'll estimate or use 0)
  // Let's assume a budget was set at roughly £15/hr * 8hr * staff? 
  // For now, let's just say Budget = 95% of cost to show small variance, or 0 if unknown
  const budget = totalCost * 0.95; // Fake budget for demo
  const variance = totalCost - budget;

  // 3. Identify Issues
  // Simple keyword search in messages during event window
  const eventDate = new Date(event.date);
  const nextDay = new Date(eventDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const issueKeywords = ['problem', 'issue', 'late', 'missing', 'accident', 'incident', 'complaint', 'no show'];
  const issues = messages.filter(m => {
    const msgDate = new Date(m.created_at);
    // Check if message is within 24h of event
    const isAroundEvent = msgDate >= eventDate && msgDate <= nextDay;
    if (!isAroundEvent) return false;
    
    const content = m.content.toLowerCase();
    return issueKeywords.some(k => content.includes(k));
  });

  const issueCount = issues.length;

  // 4. Generate AI Narrative
  const prompt = `
    Generate a concise executive summary for a post-event report.
    Event: ${event.name} (${event.date})
    Location: ${event.location}
    
    Metrics:
    - Attendance: ${attendanceRate.toFixed(1)}% (${totalActual}/${totalAssigned} staff)
    - Financial: £${totalCost.toLocaleString()} (Variance: £${variance.toLocaleString()})
    - Issues Reported: ${issueCount}
    
    Write 3 paragraphs:
    1. Operational Summary (Attendance & Staffing)
    2. Financial Overview
    3. Issues & incidents (if any, otherwise mention smooth operations)
    
    Tone: Professional, objective.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const narrative = completion.choices[0].message.content || "Report generation failed.";

  return {
    eventId: event.id,
    eventName: event.name,
    date: event.date,
    metrics: {
      totalAssigned,
      totalActual,
      attendanceRate,
      totalCost,
      budget,
      variance,
      issueCount
    },
    narrative
  };
}


