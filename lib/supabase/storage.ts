import { supabase } from './client';

// Storage bucket names
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  INVOICES: 'invoices',
  ONBOARDING: 'onboarding',
} as const;

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    contentType?: string;
    upsert?: boolean;
  }
): Promise<{ path: string; fullPath: string }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType || file.type,
      upsert: options?.upsert || false,
    });

  if (error) throw error;

  return {
    path: data.path,
    fullPath: `${bucket}/${data.path}`,
  };
}

/**
 * Get a public URL for a file (if bucket is public)
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Get a signed URL for a private file (valid for 1 hour by default)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Download a file from storage
 */
export async function downloadFile(bucket: string, path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) throw error;
  return data;
}

/**
 * Delete a file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * List files in a storage path
 */
export async function listFiles(
  bucket: string,
  path: string = '',
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: { column: 'name' | 'created_at' | 'updated_at'; order?: 'asc' | 'desc' };
  }
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: options?.limit,
      offset: options?.offset,
      sortBy: options?.sortBy,
    });

  if (error) throw error;
  return data;
}

/**
 * Upload an event document
 */
export async function uploadEventDocument(
  eventId: string,
  file: File,
  providerId?: string | null
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const path = providerId
    ? `events/${eventId}/providers/${providerId}/${fileName}`
    : `events/${eventId}/${fileName}`;

  const { fullPath } = await uploadFile(STORAGE_BUCKETS.DOCUMENTS, path, file);
  return fullPath;
}

/**
 * Upload an invoice
 */
export async function uploadInvoiceFile(
  providerId: string,
  eventId: string,
  file: File
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const path = `providers/${providerId}/events/${eventId}/${fileName}`;

  const { fullPath } = await uploadFile(STORAGE_BUCKETS.INVOICES, path, file);
  return fullPath;
}

/**
 * Upload an onboarding document
 */
export async function uploadOnboardingDocument(
  providerId: string,
  documentType: 'contractor_agreement' | 'nda',
  file: File
): Promise<string> {
  const fileName = `${documentType}-${Date.now()}.pdf`;
  const path = `providers/${providerId}/${fileName}`;

  const { fullPath } = await uploadFile(STORAGE_BUCKETS.ONBOARDING, path, file, {
    contentType: 'application/pdf',
  });
  return fullPath;
}


