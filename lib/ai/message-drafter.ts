import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MessageContext {
  eventName?: string;
  eventDate?: string;
  recipientName?: string;
  senderName?: string;
  tone?: 'professional' | 'friendly' | 'firm';
  keyPoints?: string[];
}

export async function draftMessage(purpose: string, context: MessageContext): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    return "AI message drafting is unavailable (API Key missing).";
  }

  try {
    const prompt = `
      Draft a ${context.tone || 'professional'} message for a supplier portal communication.
      
      Context:
      - Sender: ${context.senderName || 'Admin'}
      - Recipient: ${context.recipientName || 'Provider'}
      ${context.eventName ? `- Event: ${context.eventName}` : ''}
      ${context.eventDate ? `- Date: ${context.eventDate}` : ''}
      
      Purpose: ${purpose}
      
      ${context.keyPoints && context.keyPoints.length > 0 ? `Key Points to Include:\n- ${context.keyPoints.join('\n- ')}` : ''}
      
      Keep it concise, clear, and professional. Do not include subject lines unless requested.
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error drafting message:', error);
    throw error;
  }
}
