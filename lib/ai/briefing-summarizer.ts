import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BriefingSummary {
  bullets: string[];
  rawText?: string;
}

/**
 * Summarizes event briefing documents into WhatsApp-friendly bullet points
 * @param documentTexts Array of extracted text from briefing documents
 * @param eventName Name of the event
 * @param eventDate Date of the event
 * @param eventLocation Location of the event
 */
export async function summarizeBriefing(
  documentTexts: string[],
  eventName: string,
  eventDate: string,
  eventLocation: string
): Promise<BriefingSummary> {
  if (documentTexts.length === 0) {
    return {
      bullets: [
        `📍 Event: ${eventName}`,
        `📅 Date: ${eventDate}`,
        `📍 Location: ${eventLocation}`,
        '⚠️ No briefing documents available yet',
        '📞 Contact admin for details',
      ],
    };
  }

  const combinedText = documentTexts.join('\n\n---\n\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a briefing summarizer for event staff. Create concise, WhatsApp-friendly bullet points from briefing documents. 
Focus on: location details, start times, uniform requirements, risks/hazards, and key protocols.
Use emojis to make it visually clear. Keep each bullet to one line if possible. Maximum 5-7 bullets.`,
        },
        {
          role: 'user',
          content: `Event: ${eventName}
Date: ${eventDate}
Location: ${eventLocation}

Briefing Documents:
${combinedText}

Create a 5-bullet point WhatsApp summary. Format like:
📍 Location: [specific gate/entrance]
⏰ Start: [time]
👕 Uniform: [requirements]
⚠️ Risk: [key hazards]
📋 Protocol: [important rule]

If information is missing, use "TBA" or "See documents".`,
        },
      ],
      temperature: 0.3,
    });

    const summary = response.choices[0].message.content || '';
    
    // Extract bullet points (lines that start with emoji or bullet)
    const bullets = summary
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.match(/^[📍⏰👕⚠️📋🔴🟡🟢📞]/) || line.startsWith('•') || line.startsWith('-')))
      .slice(0, 7); // Max 7 bullets

    // If we didn't get good bullets, create a fallback
    if (bullets.length === 0) {
      return {
        bullets: [
          `📍 Location: ${eventLocation}`,
          `📅 Date: ${eventDate}`,
          `⏰ Start: TBA`,
          `👕 Uniform: See documents`,
          `⚠️ Review briefing documents for full details`,
        ],
        rawText: summary,
      };
    }

    return {
      bullets,
      rawText: summary,
    };
  } catch (error: any) {
    console.error('Error summarizing briefing:', error);
    
    // Fallback summary
    return {
      bullets: [
        `📍 Event: ${eventName}`,
        `📅 Date: ${eventDate}`,
        `📍 Location: ${eventLocation}`,
        `📋 ${documentTexts.length} briefing document${documentTexts.length > 1 ? 's' : ''} available`,
        '📞 Contact admin for specific details',
      ],
      rawText: error.message,
    };
  }
}

/**
 * Extracts text from a PDF or image using OpenAI Vision
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  // For images, use Vision API
  if (mimeType.startsWith('image/')) {
    const base64Image = fileBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text from this document. Include locations, times, uniform requirements, risks, and protocols. Return the text as-is, preserving structure.',
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
      });

      return response.choices[0].message.content || '';
    } catch (error: any) {
      console.error('Error extracting text from image:', error);
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  // For PDFs, we'd need a PDF parser library
  // For now, return a placeholder
  if (mimeType === 'application/pdf') {
    throw new Error('PDF text extraction requires additional setup. Please use image format or text files.');
  }

  // For text files, return as-is
  if (mimeType.startsWith('text/')) {
    return fileBuffer.toString('utf-8');
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}


