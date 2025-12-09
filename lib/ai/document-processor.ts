import OpenAI from 'openai';

export interface ExtractedStaffData {
  name: string;
  role?: string;
  siaNumber?: string;
  expiryDate?: string;
  confidence: number;
}

export interface DocumentExtractionResult {
  staff: ExtractedStaffData[];
  rawText?: string;
  success: boolean;
  error?: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processDocument(
  fileContent: string | ArrayBuffer, 
  fileType: string,
  fileName: string
): Promise<DocumentExtractionResult> {
  // Handle CSV
  if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
    return processCSV(fileContent as string);
  }

  // Handle Images or PDF (if converted to image/text)
  // For this implementation, we'll assume PDF handling via image conversion or text extraction is done elsewhere
  // or we use OpenAI Vision for images directly.
  if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
    return processImage(fileContent as ArrayBuffer);
  }

  // For PDF, we would need a PDF parser. 
  // Since we don't have one installed in the environment (like pdf-parse), 
  // we'll skip direct PDF parsing for now or assume it's text.
  // Ideally, we'd use a tool to convert PDF to image for Vision API or text for GPT.

  return {
    staff: [],
    success: false,
    error: 'Unsupported file type for AI extraction. Please use CSV or Image (JPG, PNG).',
  };
}

function processCSV(content: string): DocumentExtractionResult {
  try {
    const lines = content.split('\n');
    const staff: ExtractedStaffData[] = [];
    
    // Skip header
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
      if (cols.length >= 1) {
        staff.push({
          name: cols[0],
          role: cols[1],
          siaNumber: cols[2],
          expiryDate: cols[3], // Assuming column structure from template
          confidence: 1.0, // CSV is structured, so high confidence
        });
      }
    }

    return {
      staff,
      success: true,
    };
  } catch (error: any) {
    return {
      staff: [],
      success: false,
      error: `CSV parsing failed: ${error.message}`,
    };
  }
}

async function processImage(buffer: ArrayBuffer): Promise<DocumentExtractionResult> {
  try {
    // Convert buffer to base64
    const base64Image = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`; // Assume jpeg or generic image

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-4o if available and needed for vision
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract staff details from this staff list/SIA license list. Return a JSON object with a 'staff' array containing objects with: 'name', 'siaNumber', 'expiryDate' (YYYY-MM-DD format if possible), 'role' (if available). Only include rows that look like staff entries." },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      staff: (result.staff || []).map((s: any) => ({
        ...s,
        confidence: 0.85, // Estimate for AI extraction
      })),
      success: true,
    };

  } catch (error: any) {
    console.error('AI Vision processing failed:', error);
    return {
      staff: [],
      success: false,
      error: `AI extraction failed: ${error.message}`,
    };
  }
}
