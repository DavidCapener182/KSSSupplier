import { createServerClient } from '@/lib/supabase/server';
import { generateEventReport } from '@/lib/ai/post-event-report-generator';
import { generateEventSuccessReportPDF } from '@/lib/pdf-export';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);

    // Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch Event Data
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 2. Fetch Assignments
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('*')
      .eq('event_id', eventId);

    if (assignError) throw assignError;

    // 3. Fetch Invoices
    const { data: invoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('event_id', eventId);

    if (invError) throw invError;

    // 4. Fetch Messages (last 7 days around event)
    const eventDate = new Date(event.date);
    const startDate = new Date(eventDate);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(eventDate);
    endDate.setDate(endDate.getDate() + 3);

    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (msgError) throw msgError;

    // 5. Generate Report Data
    const reportData = await generateEventReport(
      event,
      assignments || [],
      invoices || [],
      messages || []
    );

    // 6. Generate PDF
    const pdfBlob = await generateEventSuccessReportPDF(reportData);
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // 7. Upload PDF to Storage
    const fileName = `success-report-${event.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`reports/${eventId}/${fileName}`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading report PDF:', uploadError);
      // Continue anyway, we can save the text report
    }

    const pdfPath = uploadData?.path || null;

    // 8. Save Report to DB
    const { error: saveError } = await supabase
      .from('event_success_reports')
      .upsert({
        event_id: eventId,
        report_text: reportData.narrative,
        report_pdf_path: pdfPath,
        performance_attendance_rate: reportData.metrics.attendanceRate,
        financial_total_cost: reportData.metrics.totalCost,
        financial_budget: reportData.metrics.budget,
        financial_variance: reportData.metrics.variance,
        issues_count: reportData.metrics.issueCount,
        generated_at: new Date().toISOString()
      }, { onConflict: 'event_id' });

    if (saveError) {
      console.error('Error saving report to DB:', saveError);
      return NextResponse.json({ error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: reportData, pdfPath });

  } catch (error: any) {
    console.error('Error generating event report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



