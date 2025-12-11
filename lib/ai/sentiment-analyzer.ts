import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SentimentAnalysisResult {
  score: number; // -1 to 1
  label: 'positive' | 'neutral' | 'negative';
  key_topics: string[];
  risk_keywords: string[];
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
  if (!text || text.trim().length < 5) {
    return { score: 0, label: 'neutral', key_topics: [], risk_keywords: [] };
  }

  try {
    const prompt = `
      Analyze the sentiment of the following message from a staffing provider to an event organizer.
      
      Message: "${text}"
      
      Return a JSON object with:
      - score: number between -1.0 (very negative) and 1.0 (very positive)
      - label: "positive", "neutral", or "negative"
      - key_topics: array of short strings (e.g. "Payment", "Scheduling")
      - risk_keywords: array of specific words present in the text that indicate conflict (e.g. "unpaid", "late", "dispute", "lawyer", "quit"). Empty if none.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return {
      score: result.score || 0,
      label: result.label || 'neutral',
      key_topics: result.key_topics || [],
      risk_keywords: result.risk_keywords || [],
    };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { score: 0, label: 'neutral', key_topics: [], risk_keywords: [] };
  }
}

export async function batchAnalyzeSentiment(messages: { id: string, content: string }[]): Promise<Record<string, SentimentAnalysisResult>> {
  const results: Record<string, SentimentAnalysisResult> = {};
  
  // Process in parallel with limit
  const promises = messages.map(async (msg) => {
    const result = await analyzeSentiment(msg.content);
    results[msg.id] = result;
  });

  await Promise.all(promises);
  return results;
}


