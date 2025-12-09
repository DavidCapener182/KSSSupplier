import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { analyzeSentiment } from '@/lib/ai/sentiment-analyzer';

export async function POST(request: Request) {
  try {
    const { messageId, content } = await request.json();
    
    if (!messageId || !content) {
      return NextResponse.json({ error: 'Message ID and content are required' }, { status: 400 });
    }

    const supabase = await createServerClient(request);
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Analyze
    const result = await analyzeSentiment(content);

    // Save to DB
    const { error } = await supabase
      .from('message_sentiment')
      .upsert({
        message_id: messageId,
        sentiment_score: result.score,
        sentiment_label: result.label,
        key_topics: result.key_topics,
        risk_keywords: result.risk_keywords
      }, { onConflict: 'message_id' });

    if (error) {
      console.error('Error saving sentiment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error in sentiment analysis:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
