/**
 * Unified data store interface
 * 
 * This file provides a single interface that can switch between
 * mock data (for development) and Supabase (for production)
 * based on environment variables.
 */

import { useMockDataStore } from './mock-data';
import { useSupabaseDataStore } from './supabase-store';

// Feature flag: Set to true to use Supabase, false for mock data
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

// Export the appropriate store based on the flag
export const useDataStore = USE_SUPABASE ? useSupabaseDataStore : useMockDataStore;

// Export type for convenience
export type DataStore = ReturnType<typeof useDataStore>;

