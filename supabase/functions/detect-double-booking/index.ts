// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log("Detect Double Booking Function Initialized")

Deno.serve(async (req) => {
  const payload = await req.json()
  
  // Only process INSERT events on staff_details
  if (payload.type !== 'INSERT' || payload.table !== 'staff_details') {
    return new Response(JSON.stringify({ message: 'Ignoring non-INSERT event' }), { headers: { 'Content-Type': 'application/json' } })
  }

  const newRecord = payload.record
  const { assignment_id, sia_number, staff_name } = newRecord

  try {
    // 1. Get the event_id and provider_id for this assignment
    const { data: assignment, error: assignError } = await supabase
      .from('assignments')
      .select('event_id, provider_id')
      .eq('id', assignment_id)
      .single()

    if (assignError || !assignment) {
      console.error('Assignment not found', assignError)
      return new Response(JSON.stringify({ error: 'Assignment not found' }), { status: 404 })
    }

    const { event_id, provider_id: current_provider_id } = assignment

    // 2. Search for conflicts
    // Query all staff_details for this event, excluding the current record
    // We join with assignments to filter by event_id
    
    // Note: In Edge Functions we can write raw SQL or complex joins more easily
    // But here we'll use chained queries for simplicity
    
    const { data: eventAssignments, error: eaError } = await supabase
      .from('assignments')
      .select('id, provider_id')
      .eq('event_id', event_id)
      .neq('provider_id', current_provider_id) // Only care about cross-provider conflicts

    if (eaError) {
      console.error('Error fetching event assignments', eaError)
      return new Response(JSON.stringify({ error: eaError }), { status: 500 })
    }

    if (!eventAssignments || eventAssignments.length === 0) {
       return new Response(JSON.stringify({ message: 'No other providers for this event' }), { headers: { 'Content-Type': 'application/json' } })
    }

    const assignmentIds = eventAssignments.map(a => a.id)
    
    // Fetch all staff for these assignments
    const { data: potentialConflicts, error: pcError } = await supabase
      .from('staff_details')
      .select('id, assignment_id, staff_name, sia_number')
      .in('assignment_id', assignmentIds)

    if (pcError) {
       console.error('Error fetching potential conflicts', pcError)
       return new Response(JSON.stringify({ error: pcError }), { status: 500 })
    }

    const conflicts = []

    for (const otherStaff of potentialConflicts) {
      let matchType = null
      let score = 0

      // Check SIA Number (Exact match)
      if (sia_number && otherStaff.sia_number && sia_number === otherStaff.sia_number) {
        matchType = 'sia_number'
        score = 1.0
      } 
      // Check Name (Fuzzy match - simplified for JS, use pg_trgm in SQL for better results)
      else if (staff_name && otherStaff.staff_name) {
        const similarity = calculateSimilarity(staff_name.toLowerCase(), otherStaff.staff_name.toLowerCase())
        if (similarity > 0.85) { // Threshold
           matchType = 'name_fuzzy'
           score = similarity
        }
      }

      if (matchType) {
        conflicts.push({
          event_id,
          staff_detail_id_1: newRecord.id,
          staff_detail_id_2: otherStaff.id,
          sia_number: sia_number || null,
          staff_name: staff_name,
          match_type: matchType,
          similarity_score: score,
          status: 'pending'
        })
      }
    }

    // 3. Insert Alerts
    if (conflicts.length > 0) {
      const { error: insertError } = await supabase
        .from('double_booking_alerts')
        .insert(conflicts)

      if (insertError) {
        console.error('Error inserting alerts', insertError)
        return new Response(JSON.stringify({ error: insertError }), { status: 500 })
      }

      // 4. Send Notification to Admins
      // Get all admin users
      const { data: admins } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')

      if (admins) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          type: 'double_booking',
          title: 'Double Booking Detected',
          message: `Potential double booking detected for ${staff_name} (SIA: ${sia_number || 'N/A'}).`,
          link: `/admin/events/${event_id}`,
          read: false
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }

    return new Response(JSON.stringify({ message: `Processed. Found ${conflicts.length} conflicts.` }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

// Simple Levenshtein distance for fuzzy matching in JS
function calculateSimilarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;
  if (longerLength === 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
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

