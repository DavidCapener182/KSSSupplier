'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export type ScanResult = {
  success: boolean;
  status: 'verified' | 'unlisted' | 'duplicate' | 'error';
  staffName?: string;
  providerName?: string;
  siaNumber?: string; // The scanned SIA badge number
  timestamp: string;
  message: string;
};

export async function processScan(
  eventId: string,
  scannedSia: string,
  method: 'qr_scan' | 'manual_entry' | 'ocr_scan' = 'qr_scan'
): Promise<ScanResult> {
  const supabase = createAdminClient(); // Use admin client like other admin actions
  const cleanSia = scannedSia.trim().toUpperCase();

  try {
    // 0. Configuration: Duplicate Window
    const duplicateWindowMinutes = parseInt(process.env.NEXT_PUBLIC_DUPLICATE_CHECK_WINDOW_MINUTES || '5');
    
    // 1. DUPLICATE CHECK: Did they already check in recently?
    // We check if there is a check-in for this SIA number in this event within the window
    const windowStart = new Date(Date.now() - duplicateWindowMinutes * 60 * 1000).toISOString();
    
    const { data: existingCheckIn } = await supabase
      .from('event_checkins')
      .select('check_in_time')
      .eq('event_id', eventId)
      .eq('sia_number', cleanSia)
      .gt('check_in_time', windowStart)
      .single();

    if (existingCheckIn) {
      return {
        success: false,
        status: 'duplicate',
        siaNumber: cleanSia, // Include the scanned SIA number
        timestamp: new Date().toISOString(),
        message: `Already checked in at ${new Date(existingCheckIn.check_in_time).toLocaleTimeString()}`
      };
    }

    // 2. VERIFICATION: Are they on the list for this event?
    // We join assignments to ensure we only check staff for THIS event
    const { data: match } = await supabase
      .from('staff_details')
      .select(`
        id, 
        staff_name, 
        sia_number,
        assignments!inner ( 
          id,
          event_id,
          provider_id, 
          providers ( company_name ) 
        )
      `)
      .eq('sia_number', cleanSia)
      .eq('assignments.event_id', eventId) // Crucial: Only check this event's assignments
      .maybeSingle(); // Use maybeSingle() to handle no results gracefully

    // 3. LOGIC: Determine status
    const isVerified = !!match;
    
    const staffName = match?.staff_name || 'Unknown Staff';
    // Handle assignments as array (from inner join)
    const assignment = Array.isArray(match?.assignments) ? match.assignments[0] : match?.assignments;
    const providerId = assignment?.provider_id || null;
    const providerName = (assignment?.providers as any)?.company_name || 'Unknown Provider';

    // 4. RECORD: Save to database
    const { error, data: insertedData } = await supabase.from('event_checkins').insert({
      event_id: eventId,
      staff_detail_id: match?.id || null,
      sia_number: cleanSia,
      staff_name: staffName,
      provider_id: providerId,
      verified: isVerified, // Will be true for all scans during testing
      check_in_method: method === 'ocr_scan' ? 'qr_scan' : method, // OCR is treated as qr_scan in DB
      is_duplicate: false // We already checked for duplicates within window
    }).select();

    if (error) {
      console.error('Database insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Event ID:', eventId);
      throw error;
    }
    
    console.log('Check-in recorded successfully:', insertedData);

    // 5. RESPONSE
    revalidatePath(`/admin/events/${eventId}/live`);
    
    return {
      success: true, // It's a successful scan operation, even if unlisted
      status: isVerified ? 'verified' : 'unlisted',
      staffName,
      providerName,
      siaNumber: cleanSia, // Include the scanned SIA number
      timestamp: new Date().toISOString(),
      message: isVerified ? 'Access Granted' : 'Warning: Staff not on event list'
    };

  } catch (error: any) {
    console.error('Scan Error:', error);
    return {
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'System Error: ' + (error.message || 'Unknown error')
    };
  }
}

export async function startEvent(eventId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update({ status: 'active' })
    .eq('id', eventId);
    
  if (error) throw error;
  
  revalidatePath(`/admin/events/${eventId}`);
}

export async function stopEvent(eventId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('events')
    .update({ status: 'scheduled' })
    .eq('id', eventId);
    
  if (error) throw error;
  
  revalidatePath(`/admin/events/${eventId}`);
}

export async function processStewardCheckIn(
  eventId: string,
  stewardName: string,
  providerName: string
): Promise<ScanResult> {
  const supabase = createAdminClient();

  try {
    // Find provider by name
    const { data: provider } = await supabase
      .from('providers')
      .select('id')
      .eq('company_name', providerName)
      .maybeSingle();

    // Store provider name in staff_name field as "Name | Provider" so we can retrieve it later
    // This ensures we don't lose the provider name if provider_id is null
    const staffNameWithProvider = `${stewardName} | ${providerName}`;

    // Save steward check-in to database as verified
    const { error, data: insertedData } = await supabase.from('event_checkins').insert({
      event_id: eventId,
      staff_detail_id: null, // Stewards don't have staff_detail_id
      sia_number: 'STEWARD', // Special marker
      staff_name: staffNameWithProvider, // Store name and provider together
      provider_id: provider?.id || null,
      verified: true, // Stewards count as verified/scanned correctly
      check_in_method: 'manual_entry',
      is_duplicate: false
    }).select();

    if (error) throw error;

    console.log('Steward check-in recorded successfully:', insertedData);

    // Revalidate path
    revalidatePath(`/admin/events/${eventId}/live`);

    return {
      success: true,
      status: 'verified',
      staffName: stewardName,
      providerName: providerName,
      siaNumber: 'STEWARD',
      timestamp: new Date().toISOString(),
      message: 'Steward Check-In'
    };

  } catch (error: any) {
    console.error('Steward Check-In Error:', error);
    return {
      success: false,
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'System Error: ' + (error.message || 'Unknown error')
    };
  }
}

export async function getCheckInStats(eventId: string) {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from('event_checkins')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('verified', true);

  if (error) throw error;
  return count || 0;
}

export async function deleteCheckIns(checkInIds: string[]): Promise<void> {
  const supabase = createAdminClient();
  
  if (checkInIds.length === 0) return;
  
  const { error } = await supabase
    .from('event_checkins')
    .delete()
    .in('id', checkInIds);
  
  if (error) throw error;
}

export type RecentScan = ScanResult & {
  id: string; // Add ID to the result so we can delete it
};

export async function getRecentScans(eventId: string, limit: number = 10): Promise<RecentScan[]> {
  const supabase = createAdminClient();
  
  const { data, error } = await supabase
    .from('event_checkins')
    .select(`
      id,
      check_in_time,
      staff_name,
      sia_number,
      provider_id,
      verified,
      is_duplicate,
      providers(company_name)
    `)
    .eq('event_id', eventId)
    .order('check_in_time', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return (data || []).map(checkIn => {
    const isSteward = checkIn.sia_number === 'STEWARD';
    let staffName = checkIn.staff_name;
    let providerName = (checkIn.providers as any)?.company_name;
    
    // For stewards, parse provider name from staff_name if stored as "Name | Provider"
    if (isSteward && !providerName && staffName.includes(' | ')) {
      const parts = staffName.split(' | ');
      staffName = parts[0];
      providerName = parts[1] || 'Unknown Provider';
    } else if (isSteward && !providerName) {
      // Fallback if format is different
      providerName = 'Unknown Provider';
    }
    
    return {
      id: checkIn.id,
      success: true,
      status: checkIn.is_duplicate 
        ? 'duplicate' 
        : checkIn.verified 
          ? 'verified' 
          : 'unlisted',
      staffName: staffName,
      providerName: providerName || 'Unknown Provider',
      siaNumber: checkIn.sia_number,
      timestamp: checkIn.check_in_time,
      message: isSteward 
        ? 'Steward Check-In'
        : checkIn.is_duplicate 
          ? 'Duplicate scan' 
          : checkIn.verified 
            ? 'Access Granted' 
            : 'Warning: Staff not on event list'
    };
  });
}

export type CheckInStatistics = {
  staffBooked: number;
  staffInProviderLists: number;
  scannedCorrectly: number;
  duplicates: number;
  rejected: number;
};

export async function getCheckInStatistics(eventId: string): Promise<CheckInStatistics> {
  const supabase = createAdminClient();
  
  // Get assignments for this event
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, assigned_managers, assigned_supervisors, assigned_sia, assigned_stewards')
    .eq('event_id', eventId)
    .eq('status', 'accepted');
  
  // Calculate total staff booked from assignments
  const totalBooked = assignments?.reduce((sum, a) => 
    sum + (a.assigned_managers || 0) + (a.assigned_supervisors || 0) + (a.assigned_sia || 0) + (a.assigned_stewards || 0), 0) || 0;
  
  // Get staff in provider lists (actual staff_details records)
  const assignmentIdList = assignments?.map(a => a.id) || [];
  const { count: actualStaffInLists } = assignmentIdList.length > 0
    ? await supabase
        .from('staff_details')
        .select('*', { count: 'exact', head: true })
        .in('assignment_id', assignmentIdList)
    : { count: 0 };
  
  // Get check-in statistics
  const { data: checkIns } = await supabase
    .from('event_checkins')
    .select('verified, is_duplicate')
    .eq('event_id', eventId);
  
  const scannedCorrectly = checkIns?.filter(c => c.verified && !c.is_duplicate).length || 0;
  const duplicates = checkIns?.filter(c => c.is_duplicate).length || 0;
  const rejected = checkIns?.filter(c => !c.verified && !c.is_duplicate).length || 0;
  
  return {
    staffBooked: totalBooked,
    staffInProviderLists: actualStaffInLists || 0,
    scannedCorrectly,
    duplicates,
    rejected,
  };
}

export type VerifiedCheckIn = {
  id: string;
  checkInTime: string;
  staffName: string;
  siaNumber: string;
  siaExpiryDate?: string;
  startTime?: string;
  endTime?: string;
  providerName: string;
};

export async function getVerifiedCheckIns(eventId: string): Promise<VerifiedCheckIn[]> {
  const supabase = createAdminClient();
  
  // Get verified check-ins
  const { data: checkIns, error } = await supabase
    .from('event_checkins')
    .select(`
      id,
      check_in_time,
      staff_name,
      sia_number,
      staff_detail_id,
      provider_id,
      providers(company_name)
    `)
    .eq('event_id', eventId)
    .eq('verified', true)
    .eq('is_duplicate', false)
    .order('check_in_time', { ascending: false });
  
  if (error) throw error;
  
  if (!checkIns || checkIns.length === 0) {
    return [];
  }
  
  // Get all staff detail IDs and provider IDs
  const staffDetailIds = checkIns.filter(c => c.staff_detail_id).map(c => c.staff_detail_id);
  const providerIds = checkIns.filter(c => c.provider_id).map(c => c.provider_id);
  
  // Get staff details with assignments
  const { data: staffDetails } = staffDetailIds.length > 0
    ? await supabase
        .from('staff_details')
        .select('id, assignment_id')
        .in('id', staffDetailIds)
    : { data: [] };
  
  const assignmentIds = staffDetails?.map(sd => sd.assignment_id).filter(Boolean) || [];
  
  // Get shift times for all assignments
  const { data: staffTimes } = assignmentIds.length > 0
    ? await supabase
        .from('staff_times')
        .select('assignment_id, start_time, end_time, shift_number')
        .in('assignment_id', assignmentIds)
        .order('shift_number', { ascending: true })
    : { data: [] };
  
  // Get SIA expiry dates
  const { data: siaVerifications } = staffDetailIds.length > 0
    ? await supabase
        .from('sia_license_verifications')
        .select('staff_detail_id, expiry_date')
        .in('staff_detail_id', staffDetailIds)
    : { data: [] };
  
  // Create maps for quick lookup
  const assignmentMap = new Map(staffDetails?.map(sd => [sd.id, sd.assignment_id]) || []);
  const timesMap = new Map<string, { start_time: string; end_time: string }>();
  staffTimes?.forEach(st => {
    const key = st.assignment_id;
    if (!timesMap.has(key)) {
      timesMap.set(key, { start_time: st.start_time, end_time: st.end_time });
    }
  });
  const expiryMap = new Map(siaVerifications?.map(sv => [sv.staff_detail_id, sv.expiry_date]) || []);
  
  // Build result
  return checkIns.map(checkIn => {
    const assignmentId = checkIn.staff_detail_id ? assignmentMap.get(checkIn.staff_detail_id) : null;
    const times = assignmentId ? timesMap.get(assignmentId) : null;
    const expiryDate = checkIn.staff_detail_id ? expiryMap.get(checkIn.staff_detail_id) : undefined;
    
    return {
      id: checkIn.id,
      checkInTime: checkIn.check_in_time,
      staffName: checkIn.staff_name,
      siaNumber: checkIn.sia_number,
      siaExpiryDate: expiryDate,
      startTime: times?.start_time,
      endTime: times?.end_time,
      providerName: (checkIn.providers as any)?.company_name || 'Unknown',
    };
  });
}
