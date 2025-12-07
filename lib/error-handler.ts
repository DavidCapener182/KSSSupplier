'use client';

import { toast } from '@/components/ui/use-toast';

export function handleError(error: unknown, context?: string) {
  let errorMessage = 'An unexpected error occurred';
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  const title = context ? `${context} Failed` : 'Error';
  
  toast({
    title,
    description: errorMessage,
    variant: 'destructive',
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context || 'Error'}]`, error);
  }
}

export function handleSuccess(message: string, context?: string) {
  toast({
    title: context ? `${context} Success` : 'Success',
    description: message,
    variant: 'success',
  });
}


