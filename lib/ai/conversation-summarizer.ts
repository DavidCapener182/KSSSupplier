import OpenAI from 'openai';
import { Message } from '@/lib/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}

export async function summarizeConversation(messages: Message[]): Promise<ConversationSummary> {
  if (!process.env.OPENAI_API_KEY || messages.length === 0) {
    return {
      summary: "Cannot generate summary.",
      keyPoints: [],
      actionItems: []
    };
  }

  // Format messages for AI
  const conversationText = messages.map(m => 
    `[${new Date(m.created_at).toLocaleDateString()}] ${m.sender_id}: ${m.content}`
  ).join('\n');

  try {
    const prompt = `
      Summarize this conversation between an Admin and a Provider.
      
      Conversation:
      ${conversationText}
      
      Return a JSON object with:
      - summary: A brief paragraph summarizing the discussion.
      - keyPoints: Array of important facts/agreements.
      - actionItems: Array of pending tasks or requests.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return {
      summary: result.summary || "Summary unavailable.",
      keyPoints: result.keyPoints || [],
      actionItems: result.actionItems || []
    };

  } catch (error) {
    console.error('Error summarizing conversation:', error);
    return {
      summary: "Error generating summary.",
      keyPoints: [],
      actionItems: []
    };
  }
}
