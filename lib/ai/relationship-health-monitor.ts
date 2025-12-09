import { createClient } from '@supabase/supabase-js';

export interface HealthReport {
  providerId: string;
  currentScore: number;
  trend: 'improving' | 'stable' | 'declining';
  alertLevel: 'green' | 'yellow' | 'red';
  recentTopics: string[];
  riskFactor: number; // 0-100
}

export async function calculateRelationshipHealth(
  supabase: any,
  providerId: string
): Promise<HealthReport> {
  
  // 1. Get recent sentiment data (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Query messages and sentiment separately, then join in code
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id, created_at')
    .or(`sender_id.eq.${providerId},receiver_id.eq.${providerId}`)
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (messagesError) throw messagesError;

  if (!messages || messages.length === 0) {
    return {
      providerId,
      currentScore: 0,
      trend: 'stable',
      alertLevel: 'green',
      recentTopics: [],
      riskFactor: 0
    };
  }

  // Get sentiment data for these messages
  const messageIds = messages.map((m: any) => m.id);
  const { data: sentiments, error: sentimentError } = await supabase
    .from('message_sentiment')
    .select('message_id, sentiment_score, key_topics, risk_keywords')
    .in('message_id', messageIds);

  // If table doesn't exist, return default (no sentiment data yet)
  if (sentimentError) {
    // Check if it's a schema cache error (table doesn't exist)
    if (sentimentError.message?.includes('schema cache') || sentimentError.message?.includes('does not exist')) {
      console.warn('message_sentiment table not found. Please apply migration 014_sentiment_analysis.sql');
      return {
        providerId,
        currentScore: 0,
        trend: 'stable',
        alertLevel: 'green',
        recentTopics: [],
        riskFactor: 0
      };
    }
    throw sentimentError;
  }

  // Create a map for quick lookup
  const sentimentMap = new Map();
  if (sentiments) {
    sentiments.forEach((s: any) => {
      sentimentMap.set(s.message_id, s);
    });
  }

  // Combine messages with their sentiment data
  const messagesWithSentiment = messages
    .map((m: any) => ({
      ...m,
      message_sentiment: sentimentMap.get(m.id) || null
    }))
    .filter((m: any) => m.message_sentiment !== null);

  // 2. Calculate average score
  let totalScore = 0;
  let riskCount = 0;
  const allTopics = new Set<string>();

  messagesWithSentiment.forEach((m: any) => {
    const sentiment = m.message_sentiment;
    if (sentiment) {
      totalScore += sentiment.sentiment_score;
      if (sentiment.risk_keywords && sentiment.risk_keywords.length > 0) {
        riskCount++;
      }
      if (sentiment.key_topics) {
        sentiment.key_topics.forEach((t: string) => allTopics.add(t));
      }
    }
  });

  const avgScore = messagesWithSentiment.length > 0 ? totalScore / messagesWithSentiment.length : 0;
  
  // 3. Determine trend (compare last 7 days vs previous 23)
  // Simplified for now: just map score to trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (avgScore > 0.2) trend = 'improving';
  if (avgScore < -0.2) trend = 'declining';

  // 4. Determine Alert Level
  let alertLevel: 'green' | 'yellow' | 'red' = 'green';
  if (avgScore < -0.3 || riskCount > 2) alertLevel = 'yellow';
  if (avgScore < -0.6 || riskCount > 5) alertLevel = 'red';

  // 5. Calculate Risk Factor (0-100)
  // Base on negative score and risk keywords
  let riskFactor = 0;
  if (avgScore < 0) riskFactor += Math.abs(avgScore) * 50;
  riskFactor += (riskCount * 10);
  riskFactor = Math.min(100, Math.round(riskFactor));

  return {
    providerId,
    currentScore: avgScore,
    trend,
    alertLevel,
    recentTopics: Array.from(allTopics).slice(0, 5),
    riskFactor
  };
}
