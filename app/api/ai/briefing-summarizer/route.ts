import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { summarizeBriefing, extractTextFromFile } from '@/lib/ai/briefing-summarizer';
import { STORAGE_BUCKETS } from '@/lib/supabase/storage';

export async function POST(request: Request) {
  try {
    const { eventId } = await request.json();
    
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, name, date, location')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get documents for this event (admin-uploaded, not provider-specific)
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, file_path, file_name, file_type')
      .eq('event_id', eventId)
      .is('provider_id', null) // Only admin-uploaded documents
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      // Return a basic summary if no documents
      return NextResponse.json({
        bullets: [
          `📍 Event: ${event.name}`,
          `📅 Date: ${new Date(event.date).toLocaleDateString()}`,
          `📍 Location: ${event.location}`,
          '⚠️ No briefing documents available yet',
          '📞 Contact admin for details',
        ],
      });
    }

    // Extract text from documents
    const documentTexts: string[] = [];
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const doc of documents) {
      try {
        // Parse file_path (format: "documents/events/..." or just the path)
        let bucket = STORAGE_BUCKETS.DOCUMENTS;
        let filePath = doc.file_path;
        
        // If file_path includes bucket name, extract it
        if (doc.file_path.includes('/')) {
          const pathParts = doc.file_path.split('/');
          if (pathParts[0] === 'documents' || pathParts[0] === 'invoices' || pathParts[0] === 'onboarding') {
            bucket = pathParts[0];
            filePath = pathParts.slice(1).join('/');
          }
        }

        // Download file using server client
        const { data: fileBlob, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(filePath);
        
        if (downloadError || !fileBlob) {
          throw new Error(`Failed to download file: ${downloadError?.message || 'Unknown error'}`);
        }
        
        const buffer = Buffer.from(await fileBlob.arrayBuffer());
        
        // Extract text (skip PDFs for now - would need pdf-parse library)
        if (doc.file_type === 'application/pdf') {
          console.warn(`Skipping PDF ${doc.file_name} - PDF text extraction requires additional setup`);
          skippedCount++;
          continue;
        }
        
        const text = await extractTextFromFile(buffer, doc.file_name, doc.file_type);
        if (text.trim().length > 0) {
          documentTexts.push(`[${doc.file_name}]\n${text}`);
          processedCount++;
        }
      } catch (error: any) {
        console.error(`Error processing document ${doc.id}:`, error);
        skippedCount++;
        // Continue with other documents
      }
    }

    // If we skipped all documents, provide helpful message
    if (processedCount === 0 && skippedCount > 0) {
      return NextResponse.json({
        bullets: [
          `📍 Event: ${event.name}`,
          `📅 Date: ${new Date(event.date).toLocaleDateString()}`,
          `📍 Location: ${event.location}`,
          `⚠️ ${skippedCount} document${skippedCount > 1 ? 's' : ''} available but need to be in image format for processing`,
          '📞 Contact admin or download documents directly',
        ],
        note: 'PDF documents require image conversion. Please ask admin to upload as images or use document download feature.',
      });
    }

    // Generate summary
    const summary = await summarizeBriefing(
      documentTexts,
      event.name,
      new Date(event.date).toLocaleDateString(),
      event.location
    );

    return NextResponse.json(summary);

  } catch (error: any) {
    console.error('Error generating briefing summary:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate briefing summary' }, { status: 500 });
  }
}


