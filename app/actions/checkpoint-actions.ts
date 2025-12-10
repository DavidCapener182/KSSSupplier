'use server'

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { searchSIARegister, SIARegisterResult } from './sia-register-actions';

export type ScanResult = {
  success: boolean;
  status: 'verified' | 'unlisted' | 'duplicate' | 'error' | 'signed_out';
  staffName?: string;
  providerName?: string;
  role?: string; // Staff role (Manager, Supervisor, SIA, Steward)
  siaNumber?: string; // The scanned SIA badge number
  startTime?: string; // Shift start time
  endTime?: string; // Shift end time
  signInTime?: string; // Sign in time (for sign-out scans)
  signOutTime?: string; // Sign out time (for sign-out scans)
  isSignOut?: boolean; // Whether this is a sign-out scan
  timestamp: string;
  message: string;
  registerCheck?: SIARegisterResult; // SIA register verification result
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
    const now = new Date();
    const windowStart = new Date(now.getTime() - duplicateWindowMinutes * 60 * 1000).toISOString();
    
    // 1. DUPLICATE CHECK: Did they already check in recently (within 5 minutes)?
    // We check if there is a check-in for this SIA number in this event within the window
    const { data: recentCheckIn } = await supabase
      .from('event_checkins')
      .select('id, check_in_time, sign_in_time')
      .eq('event_id', eventId)
      .eq('sia_number', cleanSia)
      .gt('check_in_time', windowStart)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentCheckIn) {
      return {
        success: false,
        status: 'duplicate',
        siaNumber: cleanSia,
        timestamp: now.toISOString(),
        message: `Already checked in at ${new Date(recentCheckIn.check_in_time).toLocaleTimeString()}`
      };
    }

    // 2. SIGN-OUT CHECK: Is there an active check-in (signed in but not signed out) more than 5 minutes ago?
    // Find the most recent check-in for this SIA that doesn't have a sign_out_time
    const { data: activeCheckIn } = await supabase
      .from('event_checkins')
      .select('id, sign_in_time, check_in_time, staff_name, staff_detail_id, provider_id')
      .eq('event_id', eventId)
      .eq('sia_number', cleanSia)
      .is('sign_out_time', null)
      .order('check_in_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If we found an active check-in, this is a sign-out
    if (activeCheckIn) {
      const signOutTime = now.toISOString();
      
      // Get staff details for the sign-out display BEFORE updating
      let staffName = activeCheckIn.staff_name || 'Unknown Staff';
      let role: string | undefined;
      let providerName = 'Unknown Provider';

      if (activeCheckIn.staff_detail_id) {
        const { data: staffDetail } = await supabase
          .from('staff_details')
          .select(`
            staff_name,
            role,
            assignments!inner (
              provider_id,
              providers ( company_name )
            )
          `)
          .eq('id', activeCheckIn.staff_detail_id)
          .maybeSingle();

        if (staffDetail) {
          staffName = staffDetail.staff_name || staffName;
          role = staffDetail.role;
          const assignment = Array.isArray(staffDetail.assignments) ? staffDetail.assignments[0] : staffDetail.assignments;
          providerName = (assignment?.providers as any)?.company_name || providerName;
        }
      } else if (activeCheckIn.provider_id) {
        const { data: provider } = await supabase
          .from('providers')
          .select('company_name')
          .eq('id', activeCheckIn.provider_id)
          .maybeSingle();
        
        if (provider) {
          providerName = provider.company_name;
        }
      }

      // Update the check-in with sign_out_time
      const { error: updateError } = await supabase
        .from('event_checkins')
        .update({ sign_out_time: signOutTime })
        .eq('id', activeCheckIn.id);

      if (updateError) {
        console.error('Error updating sign-out time:', updateError);
        throw updateError;
      }

      revalidatePath(`/admin/events/${eventId}/live`);

      // REGISTER CHECK: Verify SIA number against official register (if valid format)
      let registerCheck: SIARegisterResult | undefined;
      if (cleanSia && /^\d{16}$/.test(cleanSia)) {
        try {
          registerCheck = await searchSIARegister(cleanSia);
        } catch (error) {
          console.error('Error checking SIA register:', error);
        }
      }

      return {
        success: true,
        status: 'signed_out',
        staffName,
        providerName,
        role,
        siaNumber: cleanSia,
        signInTime: activeCheckIn.sign_in_time || activeCheckIn.check_in_time,
        signOutTime: signOutTime,
        isSignOut: true,
        timestamp: signOutTime,
        message: 'Signed Out Successfully',
        registerCheck
      };
    }

    // 3. SIGN-IN: No active check-in found, so this is a new sign-in
    // VERIFICATION: Are they on the list for this event?
    // We join assignments to ensure we only check staff for THIS event
    const { data: match } = await supabase
      .from('staff_details')
      .select(`
        id, 
        staff_name, 
        sia_number,
        role,
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

    // 4. LOGIC: Determine status
    const isVerified = !!match;
    
    const staffName = match?.staff_name || 'Unknown Staff';
    const role = match?.role || undefined;
    // Handle assignments as array (from inner join)
    const assignment = Array.isArray(match?.assignments) ? match.assignments[0] : match?.assignments;
    const providerId = assignment?.provider_id || null;
    const providerName = (assignment?.providers as any)?.company_name || 'Unknown Provider';
    const assignmentId = assignment?.id || null;
    
    // Get shift times for this assignment
    let startTime: string | undefined;
    let endTime: string | undefined;
    if (assignmentId) {
      const { data: staffTimes } = await supabase
        .from('staff_times')
        .select('start_time, end_time, shift_number')
        .eq('assignment_id', assignmentId)
        .order('shift_number', { ascending: true })
        .limit(1);
      
      if (staffTimes && staffTimes.length > 0) {
        startTime = staffTimes[0].start_time;
        endTime = staffTimes[0].end_time;
      }
    }

    // 5. RECORD: Save sign-in to database
    const signInTime = now.toISOString();
    const { error, data: insertedData } = await supabase.from('event_checkins').insert({
      event_id: eventId,
      staff_detail_id: match?.id || null,
      sia_number: cleanSia,
      staff_name: staffName,
      provider_id: providerId,
      verified: isVerified,
      check_in_method: method === 'ocr_scan' ? 'qr_scan' : method, // OCR is treated as qr_scan in DB
      is_duplicate: false, // We already checked for duplicates within window
      sign_in_time: signInTime // Set sign_in_time for new check-ins
    }).select();

    if (error) {
      console.error('Database insert error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Event ID:', eventId);
      throw error;
    }
    
    console.log('Check-in recorded successfully:', insertedData);

    // 6. REGISTER CHECK: Verify SIA number against official register (if valid format)
    let registerCheck: SIARegisterResult | undefined;
    if (cleanSia && /^\d{16}$/.test(cleanSia)) {
      try {
        registerCheck = await searchSIARegister(cleanSia);
      } catch (error) {
        console.error('Error checking SIA register:', error);
        // Don't fail the scan if register check fails
      }
    }

    // 7. RESPONSE
    revalidatePath(`/admin/events/${eventId}/live`);
    
    return {
      success: true, // It's a successful scan operation, even if unlisted
      status: isVerified ? 'verified' : 'unlisted',
      staffName,
      providerName,
      role,
      siaNumber: cleanSia,
      startTime,
      endTime,
      signInTime: signInTime,
      isSignOut: false,
      timestamp: signInTime,
      message: isVerified ? 'Access Granted' : 'Warning: Staff not on event list',
      registerCheck
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
      sign_in_time,
      sign_out_time,
      staff_name,
      sia_number,
      staff_detail_id,
      provider_id,
      verified,
      is_duplicate,
      providers(company_name)
    `)
    .eq('event_id', eventId)
    .order('check_in_time', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  // Get staff detail IDs to fetch roles
  const staffDetailIds = (data || []).filter(c => c.staff_detail_id).map(c => c.staff_detail_id);
  const { data: staffDetails } = staffDetailIds.length > 0
    ? await supabase
        .from('staff_details')
        .select('id, role')
        .in('id', staffDetailIds)
    : { data: [] };
  
  const roleMap = new Map(staffDetails?.map(sd => [sd.id, sd.role]) || []);
  
  return (data || []).map(checkIn => {
    const isSteward = checkIn.sia_number === 'STEWARD';
    let staffName = checkIn.staff_name;
    let providerName = (checkIn.providers as any)?.company_name;
    const role = checkIn.staff_detail_id ? roleMap.get(checkIn.staff_detail_id) : undefined;
    
    // For stewards, parse provider name from staff_name if stored as "Name | Provider"
    if (isSteward && !providerName && staffName.includes(' | ')) {
      const parts = staffName.split(' | ');
      staffName = parts[0];
      providerName = parts[1] || 'Unknown Provider';
    } else if (isSteward && !providerName) {
      // Fallback if format is different
      providerName = 'Unknown Provider';
    }
    
    const signInTime = checkIn.sign_in_time || checkIn.check_in_time;
    const signOutTime = checkIn.sign_out_time;
    const isSignOut = !!signOutTime;

    return {
      id: checkIn.id,
      success: true,
      status: isSignOut 
        ? 'signed_out'
        : checkIn.is_duplicate 
          ? 'duplicate' 
          : checkIn.verified 
            ? 'verified' 
            : 'unlisted',
      staffName: staffName,
      providerName: providerName || 'Unknown Provider',
      role,
      siaNumber: checkIn.sia_number,
      signInTime: signInTime,
      signOutTime: signOutTime,
      isSignOut: isSignOut,
      timestamp: checkIn.check_in_time,
      message: isSteward 
        ? 'Steward Check-In'
        : isSignOut
          ? 'Signed Out'
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
  signInTime?: string;
  signOutTime?: string;
  staffName: string;
  role?: string;
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
      sign_in_time,
      sign_out_time,
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
  
  // Get staff details with assignments and expiry dates
  const { data: staffDetails } = staffDetailIds.length > 0
    ? await supabase
        .from('staff_details')
        .select('id, assignment_id, role, sia_expiry_date')
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
  
  // Create maps for quick lookup
  const assignmentMap = new Map(staffDetails?.map(sd => [sd.id, sd.assignment_id]) || []);
  const roleMap = new Map(staffDetails?.map(sd => [sd.id, sd.role]) || []);
  const expiryMap = new Map(staffDetails?.map(sd => [sd.id, sd.sia_expiry_date]) || []);
  const timesMap = new Map<string, { start_time: string; end_time: string }>();
  staffTimes?.forEach(st => {
    const key = st.assignment_id;
    if (!timesMap.has(key)) {
      timesMap.set(key, { start_time: st.start_time, end_time: st.end_time });
    }
  });
  
  // Build result
  return checkIns.map(checkIn => {
    const assignmentId = checkIn.staff_detail_id ? assignmentMap.get(checkIn.staff_detail_id) : null;
    const times = assignmentId ? timesMap.get(assignmentId) : null;
    const expiryDate = checkIn.staff_detail_id ? expiryMap.get(checkIn.staff_detail_id) : undefined;
    const role = checkIn.staff_detail_id ? roleMap.get(checkIn.staff_detail_id) : undefined;
    
    return {
      id: checkIn.id,
      checkInTime: checkIn.check_in_time,
      signInTime: checkIn.sign_in_time || checkIn.check_in_time,
      signOutTime: checkIn.sign_out_time,
      staffName: checkIn.staff_name,
      role,
      siaNumber: checkIn.sia_number,
      siaExpiryDate: expiryDate,
      startTime: times?.start_time,
      endTime: times?.end_time,
      providerName: (checkIn.providers as any)?.company_name || 'Unknown',
    };
  });
}
