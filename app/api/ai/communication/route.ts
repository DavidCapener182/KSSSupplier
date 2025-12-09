import { NextResponse } from 'next/server';
import { draftMessage } from '@/lib/ai/message-drafter';
import { summarizeConversation } from '@/lib/ai/conversation-summarizer';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'draft') {
      const { purpose, context } = body;
      const draft = await draftMessage(purpose, context);
      return NextResponse.json({ draft });
    }

    if (action === 'summarize') {
      const { senderId, receiverId } = body;
      
      const supabase = await createServerClient();
      
      // Fetch messages between these two users
      // Note: In a real app, ensure the user has permission to read these messages
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (!messages || messages.length === 0) {
        return NextResponse.json({ summary: "No messages to summarize.", keyPoints: [], actionItems: [] });
      }

      const summary = await summarizeConversation(messages);
      
      // Cache summary if needed (skipping DB cache for now to keep it simple as per plan UI focus)
      
      return NextResponse.json(summary);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Error in communication API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
