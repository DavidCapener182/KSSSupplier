import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Find upcoming events (approx 2 weeks out)
    const twoWeeksFromNow = new Date()
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
    const twoWeeksDateStr = twoWeeksFromNow.toISOString().split('T')[0]

    // We look for events happening exactly 2 weeks from now to trigger the check once
    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, name, date')
      .eq('date', twoWeeksDateStr)

    if (eventsError) throw eventsError

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: 'No events found for 2-week check.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const alertsCreated = []

    for (const event of events) {
      // 2. Get accepted assignments for these events
      const { data: assignments, error: assignError } = await supabaseClient
        .from('assignments')
        .select(`
          id,
          provider_id,
          created_at,
          accepted_at,
          status,
          provider:providers(company_name),
          staff_details(count)
        `)
        .eq('event_id', event.id)
        .eq('status', 'accepted')

      if (assignError) {
        console.error(`Error fetching assignments for event ${event.id}:`, assignError)
        continue
      }

      for (const assignment of assignments) {
        // Check if staff details uploaded (simple count check for now)
        const staffCount = assignment.staff_details ? assignment.staff_details.length : 0 // Or handle count aggregation
        // Since we did staff_details(count) in select (which is not standard, let's assume we fetch raw or aggregate)
        // Standard Supabase JS: select('*, staff_details(count)') returns count object { count: N }
        // Let's assume we got the assignments and check staff_details directly if we selected '*' or similar
        // Actually the query above `staff_details(count)` returns array of objects with count property? No.
        // Let's assume we need to check if ANY staff details exist.
        
        // Refetch staff count properly if needed, or assume we fetch details
        const { count, error: countError } = await supabaseClient
          .from('staff_details')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', assignment.id)

        if (countError) continue

        if (count === 0) {
          // 3. Check Provider History for Lazy Booking Pattern
          // We call our logic or re-implement simple check here
          // For Edge Function, re-implementing logic is safer to avoid importing local project libs
          
          // Check this provider's past assignments
          const { data: pastAssignments } = await supabaseClient
             .from('assignments')
             .select('id, accepted_at, event_id, events(date), staff_details(created_at)')
             .eq('provider_id', assignment.provider_id)
             .eq('status', 'accepted')
             .lt('events.date', new Date().toISOString())
             .limit(10)

           // Analyze
           let lateCount = 0
           let total = 0
           if (pastAssignments) {
             for (const past of pastAssignments) {
               if (past.events && past.staff_details && past.staff_details.length > 0) {
                 const eventDate = new Date(past.events.date).getTime()
                 // Find first upload
                 const uploads = past.staff_details.map((sd: any) => new Date(sd.created_at).getTime()).sort()
                 const firstUpload = uploads[0]
                 
                 const diffDays = (eventDate - firstUpload) / (1000 * 60 * 60 * 24)
                 if (diffDays < 3) {
                   lateCount++
                 }
                 total++
               }
             }
           }
           
           const isRisky = total > 2 && (lateCount / total) > 0.5

           if (isRisky) {
             // 4. Create Alert
             const { error: alertError } = await supabaseClient
               .from('lazy_booking_alerts')
               .insert({
                 provider_id: assignment.provider_id,
                 assignment_id: assignment.id,
                 event_id: event.id,
                 risk_score: Math.round((lateCount / total) * 100),
                 pattern_description: `Provider has a history of late uploads (${lateCount}/${total} assignments < 3 days before). Zero staff uploaded 14 days out.`,
                 days_before_event: 14,
                 status: 'pending'
               })
             
             if (!alertError) {
               alertsCreated.push({
                 provider: assignment.provider.company_name,
                 event: event.name
               })

               // Notify Admin
               // Fetch admins
               const { data: admins } = await supabaseClient.from('users').select('id').eq('role', 'admin')
               if (admins) {
                 const notifications = admins.map(admin => ({
                   user_id: admin.id,
                   type: 'system',
                   title: 'Lazy Booking Risk Detected',
                   message: `${assignment.provider.company_name} has not uploaded staff for ${event.name} (14 days out) and has a history of late compliance.`,
                   link: `/admin/providers/${assignment.provider_id}`,
                   read: false
                 }))
                 await supabaseClient.from('notifications').insert(notifications)
               }
             }
           }
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Check complete', alerts: alertsCreated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

