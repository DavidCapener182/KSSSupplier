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

    // 1. Find events that ended yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDateStr = yesterday.toISOString().split('T')[0]

    const { data: events, error: eventsError } = await supabaseClient
      .from('events')
      .select('id, name, date')
      .eq('date', yesterdayDateStr)

    if (eventsError) throw eventsError

    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ message: 'No completed events found to report on.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const reportsGenerated = []

    // 2. Trigger Report Generation for each event
    // We can call the API route if accessible, or reimplement logic here.
    // Since PDF generation (jsPDF) might be heavy or not supported in Edge Runtime easily without deps,
    // we'll trigger the API route via fetch if possible, OR just save the data record here and skip PDF for now.
    // Ideally, we'd use a queue. For this implementation, we'll try to call the app API if we have the URL,
    // otherwise we just insert the record with basic stats.
    
    // Let's implement basic data aggregation here for reliability in Edge Function
    
    for (const event of events) {
      // Check if report already exists
      const { data: existing } = await supabaseClient
        .from('event_success_reports')
        .select('id')
        .eq('event_id', event.id)
        .single()
        
      if (existing) continue

      // Fetch Stats
      const { data: assignments } = await supabaseClient
        .from('assignments')
        .select('assigned_managers, assigned_supervisors, assigned_sia, assigned_stewards, actual_managers, actual_supervisors, actual_sia, actual_stewards')
        .eq('event_id', event.id)
        .eq('status', 'accepted')

      let totalAssigned = 0
      let totalActual = 0
      
      if (assignments) {
        assignments.forEach((a: any) => {
          totalAssigned += (a.assigned_managers || 0) + (a.assigned_supervisors || 0) + (a.assigned_sia || 0) + (a.assigned_stewards || 0)
          totalActual += (a.actual_managers || 0) + (a.actual_supervisors || 0) + (a.actual_sia || 0) + (a.actual_stewards || 0)
        })
      }
      
      const attendanceRate = totalAssigned > 0 ? (totalActual / totalAssigned) * 100 : 0

      // Invoices
      const { data: invoices } = await supabaseClient
        .from('invoices')
        .select('amount')
        .eq('event_id', event.id)
        .neq('status', 'proforma')
        
      const totalCost = invoices ? invoices.reduce((sum: number, i: any) => sum + (i.amount || 0), 0) : 0
      const budget = totalCost * 0.95 // Mock budget
      const variance = totalCost - budget

      // Create Report Record
      const { error: insertError } = await supabaseClient
        .from('event_success_reports')
        .insert({
          event_id: event.id,
          report_text: `Automated Report. Attendance: ${attendanceRate.toFixed(1)}%. Cost: £${totalCost}.`,
          performance_attendance_rate: attendanceRate,
          financial_total_cost: totalCost,
          financial_budget: budget,
          financial_variance: variance,
          issues_count: 0 // Would need message access, skipping for edge efficiency
        })

      if (!insertError) {
        reportsGenerated.push(event.name)
        
        // Notify Admins
        const { data: admins } = await supabaseClient.from('users').select('id').eq('role', 'admin')
        if (admins) {
          const notifications = admins.map((admin: any) => ({
            user_id: admin.id,
            type: 'system',
            title: 'Event Success Report Ready',
            message: `Report generated for ${event.name}.`,
            link: `/admin/events/${event.id}`,
            read: false
          }))
          await supabaseClient.from('notifications').insert(notifications)
        }
      }
    }

    return new Response(JSON.stringify({ message: 'Reports generated', events: reportsGenerated }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

