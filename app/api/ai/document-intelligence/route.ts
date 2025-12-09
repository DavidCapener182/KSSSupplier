import { NextResponse } from 'next/server';
import { processDocument } from '@/lib/ai/document-processor';
import { validateSIALicense } from '@/lib/ai/sia-validator';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    
    // Process document using AI/Rules
    const extractionResult = await processDocument(buffer, file.type, file.name);

    if (!extractionResult.success) {
      return NextResponse.json({ error: extractionResult.error }, { status: 422 });
    }

    // Validate extracted data
    const validatedStaff = extractionResult.staff.map(staff => {
      let validation = { isValid: true, errors: [] as string[] };
      
      if (staff.siaNumber) {
        validation = validateSIALicense(staff.siaNumber, staff.expiryDate);
      }

      return {
        ...staff,
        validation
      };
    });

    return NextResponse.json({
      staff: validatedStaff,
      count: validatedStaff.length,
    });

  } catch (error: any) {
    console.error('Error processing document:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
