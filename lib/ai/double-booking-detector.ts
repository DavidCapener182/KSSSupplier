import { createClient } from '@supabase/supabase-js';
import { DoubleBookingAlert } from '@/lib/types';

// Simple Levenshtein distance for fuzzy matching
function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
}

function editDistance(s1: string, s2: string) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  const costs = new Array();
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

export async function detectDoubleBookings(
  supabase: any, // Typed as SupabaseClient if available
  eventId: string
): Promise<DoubleBookingAlert[]> {
  
  // 1. Fetch all assignments for this event
  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('id, provider_id, providers(company_name)')
    .eq('event_id', eventId);

  if (assignError || !assignments || assignments.length === 0) {
    throw new Error('Failed to fetch assignments for event');
  }

  // 2. Fetch all staff details for these assignments
  const assignmentIds = assignments.map((a: any) => a.id);
  
  const { data: staffDetails, error: staffError } = await supabase
    .from('staff_details')
    .select('id, assignment_id, staff_name, sia_number')
    .in('assignment_id', assignmentIds);

  if (staffError || !staffDetails) {
    throw new Error('Failed to fetch staff details');
  }

  const conflicts: any[] = [];
  const processedPairs = new Set<string>();

  // Compare every staff member with every other staff member
  for (let i = 0; i < staffDetails.length; i++) {
    for (let j = i + 1; j < staffDetails.length; j++) {
      const staff1 = staffDetails[i];
      const staff2 = staffDetails[j];
      
      const assignment1 = assignments.find((a: any) => a.id === staff1.assignment_id);
      const assignment2 = assignments.find((a: any) => a.id === staff2.assignment_id);

      // Only check cross-provider conflicts
      if (assignment1.provider_id === assignment2.provider_id) continue;

      let matchType = null;
      let score = 0;

      // Check SIA Number (Exact match)
      if (staff1.sia_number && staff2.sia_number && staff1.sia_number === staff2.sia_number) {
        matchType = 'sia_number';
        score = 1.0;
      } 
      // Check Name (Fuzzy match)
      else if (staff1.staff_name && staff2.staff_name) {
        const similarity = calculateSimilarity(staff1.staff_name, staff2.staff_name);
        if (similarity > 0.85) { // Threshold
           matchType = 'name_fuzzy';
           score = similarity;
        }
      }

      if (matchType) {
        const pairKey = [staff1.id, staff2.id].sort().join('-');
        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        conflicts.push({
          event_id: eventId,
          staff_detail_id_1: staff1.id,
          staff_detail_id_2: staff2.id,
          sia_number: staff1.sia_number === staff2.sia_number ? staff1.sia_number : null,
          staff_name: staff1.staff_name, // Using first one as representative
          match_type: matchType,
          similarity_score: score,
          status: 'pending',
          provider1_name: assignment1.providers.company_name,
          provider2_name: assignment2.providers.company_name
        });
      }
    }
  }

  return conflicts;
}
