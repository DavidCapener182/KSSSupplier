import { supabase } from './client';
import { uploadFile, STORAGE_BUCKETS } from './storage';
import type {
  Event,
  Provider,
  Assignment,
  ProviderAvailability,
  StaffDetail,
  StaffTimes,
  Message,
  Document,
  Invoice,
  EventTemplate,
  ActivityLog,
  Notification,
  OnboardingDocument,
  DocumentComment,
} from '@/lib/types';

// Helper to transform database row to Event
function transformEvent(row: any): Event {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    date: row.date,
    requirements: {
      managers: row.requirements_managers,
      supervisors: row.requirements_supervisors,
      sia: row.requirements_sia,
      stewards: row.requirements_stewards,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Helper to transform database row to Provider
function transformProvider(row: any): Provider {
  return {
    id: row.id,
    user_id: row.user_id,
    company_name: row.company_name,
    contact_email: row.contact_email,
    contact_phone: row.contact_phone,
    address: row.address,
    company_registration: row.company_registration,
    director_contact_name: row.director_contact_name,
    notes: row.notes,
    status: row.status,
    submitted_at: row.submitted_at,
    approved_at: row.approved_at,
    rejected_at: row.rejected_at,
    rejection_reason: row.rejection_reason,
  };
}

// Helper to transform database row to Assignment
function transformAssignment(row: any): Assignment {
  return {
    id: row.id,
    event_id: row.event_id,
    provider_id: row.provider_id,
    assigned_managers: row.assigned_managers,
    assigned_supervisors: row.assigned_supervisors,
    assigned_sia: row.assigned_sia,
    assigned_stewards: row.assigned_stewards,
    status: row.status,
    accepted_at: row.accepted_at,
    details_requested: row.details_requested,
    times_sent: row.times_sent || false,
    timesheets_confirmed: row.timesheets_confirmed ?? false,
    actual_managers: row.actual_managers,
    actual_supervisors: row.actual_supervisors,
    actual_sia: row.actual_sia,
    actual_stewards: row.actual_stewards,
  };
}

// Events
export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) throw error;
  return data.map(transformEvent);
}

export async function getEvent(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return transformEvent(data);
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: event.name,
      location: event.location,
      date: event.date,
      requirements_managers: event.requirements.managers,
      requirements_supervisors: event.requirements.supervisors,
      requirements_sia: event.requirements.sia,
      requirements_stewards: event.requirements.stewards,
    })
    .select()
    .single();

  if (error) throw error;
  return transformEvent(data);
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.location !== undefined) updateData.location = updates.location;
  if (updates.date !== undefined) updateData.date = updates.date;
  if (updates.requirements) {
    updateData.requirements_managers = updates.requirements.managers;
    updateData.requirements_supervisors = updates.requirements.supervisors;
    updateData.requirements_sia = updates.requirements.sia;
    updateData.requirements_stewards = updates.requirements.stewards;
  }

  // Add updated_at timestamp
  updateData.updated_at = new Date().toISOString();

  // First verify the event exists
  const existingEvent = await getEvent(id);
  if (!existingEvent) {
    throw new Error('Event not found');
  }

  const { data: updateResult, error: updateError } = await supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select('*');

  if (updateError) {
    console.error('Error updating event:', updateError);
    console.error('Update data:', updateData);
    console.error('Event ID:', id);
    throw updateError;
  }

  if (!updateResult || updateResult.length === 0) {
    // If update didn't affect rows, it might be an RLS issue
    console.error('Update did not affect any rows. Event ID:', id);
    console.error('Update data:', updateData);
    throw new Error('Update failed: No rows were updated. This may be due to permissions or the event not existing.');
  }

  // Transform and return the updated event
  return transformEvent(updateResult[0]);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Providers
export async function getProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .order('company_name', { ascending: true });

  if (error) throw error;
  return data.map(transformProvider);
}

export async function getProvider(id: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return transformProvider(data);
}

export async function getProviderByUserId(userId: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return transformProvider(data);
}

export async function createProvider(provider: Omit<Provider, 'id'>): Promise<Provider> {
  const { data, error } = await supabase
    .from('providers')
    .insert({
      user_id: provider.user_id,
      company_name: provider.company_name,
      contact_email: provider.contact_email,
      contact_phone: provider.contact_phone,
      address: provider.address,
      company_registration: provider.company_registration,
      director_contact_name: provider.director_contact_name,
      notes: provider.notes,
      status: provider.status || 'pending',
      submitted_at: provider.submitted_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return transformProvider(data);
}

export async function updateProvider(id: string, updates: Partial<Provider>): Promise<Provider> {
  const { data, error } = await supabase
    .from('providers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return transformProvider(data);
}

export async function approveProvider(id: string): Promise<void> {
  const { error } = await supabase
    .from('providers')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function rejectProvider(id: string, reason?: string): Promise<void> {
  const { error } = await supabase
    .from('providers')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', id);

  if (error) throw error;
}

export async function getPendingProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true });

  if (error) throw error;
  return data.map(transformProvider);
}

// Assignments
export async function getAssignments(): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformAssignment);
}

export async function getAssignmentsByEvent(eventId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformAssignment);
}

export async function getAssignmentsByProvider(providerId: string): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformAssignment);
}

export async function createAssignment(assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      event_id: assignment.event_id,
      provider_id: assignment.provider_id,
      assigned_managers: assignment.assigned_managers,
      assigned_supervisors: assignment.assigned_supervisors,
      assigned_sia: assignment.assigned_sia,
      assigned_stewards: assignment.assigned_stewards,
      status: assignment.status || 'pending',
      details_requested: assignment.details_requested || false,
    })
    .select()
    .single();

  if (error) throw error;
  return transformAssignment(data);
}

export async function updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment> {
  const updateData: any = {};
  
  if (updates.assigned_managers !== undefined) updateData.assigned_managers = updates.assigned_managers;
  if (updates.assigned_supervisors !== undefined) updateData.assigned_supervisors = updates.assigned_supervisors;
  if (updates.assigned_sia !== undefined) updateData.assigned_sia = updates.assigned_sia;
  if (updates.assigned_stewards !== undefined) updateData.assigned_stewards = updates.assigned_stewards;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.details_requested !== undefined) updateData.details_requested = updates.details_requested;
  if (updates.times_sent !== undefined) updateData.times_sent = updates.times_sent;
  if (updates.accepted_at !== undefined) updateData.accepted_at = updates.accepted_at;
  if (updates.declined_at !== undefined) updateData.declined_at = updates.declined_at;
  if (updates.actual_managers !== undefined) updateData.actual_managers = updates.actual_managers;
  if (updates.actual_supervisors !== undefined) updateData.actual_supervisors = updates.actual_supervisors;
  if (updates.actual_sia !== undefined) updateData.actual_sia = updates.actual_sia;
  if (updates.actual_stewards !== undefined) updateData.actual_stewards = updates.actual_stewards;

  // Add updated_at timestamp
  updateData.updated_at = new Date().toISOString();

  // Perform the update
  const { error: updateError } = await supabase
    .from('assignments')
    .update(updateData)
    .eq('id', id);

  if (updateError) {
    console.error('Error updating assignment:', updateError);
    console.error('Update data:', updateData);
    console.error('Assignment ID:', id);
    throw updateError;
  }

  // Fetch the updated row separately to avoid RLS issues with select on update
  const { data, error: selectError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single();

  if (selectError) {
    console.error('Error fetching updated assignment:', selectError);
    throw new Error(`Failed to fetch updated assignment: ${selectError.message}`);
  }

  if (!data) {
    throw new Error('Assignment not found after update');
  }

  return transformAssignment(data);
}

export async function acceptAssignment(id: string): Promise<Assignment> {
  console.log('acceptAssignment called with id:', id);
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current Supabase user:', user);
  
  const { data, error } = await supabase
    .from('assignments')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error accepting assignment:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error details:', error.details);
    throw error;
  }
  
  if (!data) {
    throw new Error('No data returned from assignment update');
  }
  
  return transformAssignment(data);
}

export async function declineAssignment(id: string): Promise<Assignment> {
  const { data, error } = await supabase
    .from('assignments')
    .update({
      status: 'declined',
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return transformAssignment(data);
}

export async function deleteAssignment(id: string): Promise<void> {
  const { error } = await supabase
    .from('assignments')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Provider Availability
function transformAvailability(row: any): ProviderAvailability {
  return {
    id: row.id,
    event_id: row.event_id,
    provider_id: row.provider_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getProviderAvailability(providerId: string): Promise<ProviderAvailability[]> {
  const { data, error } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('provider_id', providerId);

  if (error) throw error;
  return (data || []).map(transformAvailability);
}

export async function getEventAvailability(eventId: string): Promise<ProviderAvailability[]> {
  const { data, error } = await supabase
    .from('provider_availability')
    .select('*')
    .eq('event_id', eventId);

  if (error) throw error;
  return (data || []).map(transformAvailability);
}

export async function upsertProviderAvailability(
  providerId: string,
  eventId: string,
  status: 'available' | 'unavailable'
): Promise<ProviderAvailability> {
  const { data, error } = await supabase
    .from('provider_availability')
    .upsert(
      {
        provider_id: providerId,
        event_id: eventId,
        status,
      },
      { onConflict: 'event_id,provider_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return transformAvailability(data);
}

// Staff Details
export async function getStaffDetailsByAssignment(assignmentId: string): Promise<StaffDetail[]> {
  const { data, error } = await supabase
    .from('staff_details')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function addStaffDetail(staff: Omit<StaffDetail, 'id' | 'created_at'>): Promise<StaffDetail> {
  const { data, error } = await supabase
    .from('staff_details')
    .insert({
      assignment_id: staff.assignment_id,
      staff_name: staff.staff_name,
      role: staff.role,
      sia_number: staff.sia_number,
      pnc_info: staff.pnc_info,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addStaffDetails(staffList: Omit<StaffDetail, 'id' | 'created_at'>[]): Promise<StaffDetail[]> {
  const { data, error } = await supabase
    .from('staff_details')
    .insert(staffList.map(s => ({
      assignment_id: s.assignment_id,
      staff_name: s.staff_name,
      role: s.role,
      sia_number: s.sia_number,
      pnc_info: s.pnc_info,
    })))
    .select();

  if (error) throw error;
  return data;
}

// Staff Times
export async function getStaffTimesByAssignment(assignmentId: string): Promise<StaffTimes[]> {
  const { data, error } = await supabase
    .from('staff_times')
    .select('*')
    .eq('assignment_id', assignmentId)
    .order('shift_number', { ascending: true })
    .order('role_type', { ascending: true });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    assignment_id: row.assignment_id,
    role_type: row.role_type,
    staff_count: row.staff_count,
    start_time: row.start_time,
    end_time: row.end_time,
    shift_number: row.shift_number,
    sent_at: row.sent_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createStaffTimes(
  staffTimes: Omit<StaffTimes, 'id' | 'created_at' | 'updated_at' | 'sent_at'> & { sent_at?: string }
): Promise<StaffTimes> {
  const { data, error } = await supabase
    .from('staff_times')
    .insert({
      assignment_id: staffTimes.assignment_id,
      role_type: staffTimes.role_type,
      staff_count: staffTimes.staff_count,
      start_time: staffTimes.start_time,
      end_time: staffTimes.end_time,
      shift_number: staffTimes.shift_number,
      sent_at: staffTimes.sent_at || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    assignment_id: data.assignment_id,
    role_type: data.role_type,
    staff_count: data.staff_count,
    start_time: data.start_time,
    end_time: data.end_time,
    shift_number: data.shift_number,
    sent_at: data.sent_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deleteStaffTimesByAssignment(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('staff_times')
    .delete()
    .eq('assignment_id', assignmentId);

  if (error) throw error;
}

// Messages
export async function getMessages(senderId: string, receiverId: string): Promise<Message[]> {
  // Fetch messages where current user is involved (RLS will filter)
  // Then filter client-side to get conversation between senderId and receiverId
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    console.error('Error details:', error);
    throw error;
  }
  
  // Filter to only messages between these two specific users
  // RLS policies ensure we only see messages where current user is sender or receiver
  const filteredData = (data || []).filter(
    (msg) =>
      (msg.sender_id === senderId && msg.receiver_id === receiverId) ||
      (msg.sender_id === receiverId && msg.receiver_id === senderId)
  );

  return filteredData.map(row => ({
    id: row.id,
    sender_id: row.sender_id,
    receiver_id: row.receiver_id,
    content: row.content,
    timestamp: row.created_at,
    created_at: row.created_at,
    read: row.read || false,
  }));
}

// Helper function to get admin user ID from existing messages
// Providers can't query users table due to RLS, so we find admin from messages
export async function getAdminUserId(userId: string): Promise<string | null> {
  // Get all messages for this user (RLS will filter to only messages where user is sender or receiver)
  const { data: messageData, error } = await supabase
    .from('messages')
    .select('sender_id, receiver_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching messages to find admin:', error);
    return null;
  }

  if (!messageData || messageData.length === 0) {
    return null;
  }

  // Find admin user ID - it's the user who is NOT the current user
  // Since providers only message with admin, the other user ID should be admin
  const otherUserIds = new Set<string>();
  messageData.forEach(msg => {
    if (msg.sender_id !== userId) {
      otherUserIds.add(msg.sender_id);
    }
    if (msg.receiver_id !== userId) {
      otherUserIds.add(msg.receiver_id);
    }
  });

  // Return the first other user ID (assuming it's the admin)
  // In practice, providers only message with admin, so this should work
  return otherUserIds.size > 0 ? Array.from(otherUserIds)[0] : null;
}

export async function sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'created_at'>): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      content: message.content,
      read: message.read || false,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    sender_id: data.sender_id,
    receiver_id: data.receiver_id,
    content: data.content,
    timestamp: data.created_at,
    created_at: data.created_at,
    read: data.read,
  };
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('id', messageId);

  if (error) throw error;
}

export async function markConversationRead(userId: string, otherUserId: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', otherUserId);

  if (error) {
    console.error('Error marking conversation read:', error);
    throw error;
  }
}

export async function deleteMessage(id: string): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}

export async function deleteConversation(userA: string, userB: string): Promise<void> {
  const { error, count } = await supabase
    .from('messages')
    .delete({ count: 'exact' })
    .or(`and(sender_id.eq.${userA},receiver_id.eq.${userB}),and(sender_id.eq.${userB},receiver_id.eq.${userA})`);

  if (error) {
    console.error('Error clearing conversation:', error);
    throw error;
  }
  
  console.log(`Deleted ${count} messages between ${userA} and ${userB}`);
}

export async function getUnreadMessageCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);

  if (error) {
    console.error('Error fetching unread message count:', error);
    throw error;
  }

  return count || 0;
}

// Documents
export async function getDocumentsByEvent(eventId: string, providerId?: string | null): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('event_id', eventId);

  if (providerId !== undefined) {
    if (providerId === null) {
      query = query.is('provider_id', null);
    } else {
      query = query.eq('provider_id', providerId);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    event_id: row.event_id,
    provider_id: row.provider_id,
    file_path: row.file_path,
    file_name: row.file_name,
    file_type: row.file_type,
    created_at: row.created_at,
  }));
}

export async function uploadDocument(document: Omit<Document, 'id' | 'created_at'>): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      event_id: document.event_id,
      provider_id: document.provider_id,
      file_path: document.file_path,
      file_name: document.file_name,
      file_type: document.file_type,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    event_id: data.event_id,
    provider_id: data.provider_id,
    file_path: data.file_path,
    file_name: data.file_name,
    file_type: data.file_type,
    created_at: data.created_at,
  };
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Document Comments
export async function getDocumentComments(documentId: string): Promise<DocumentComment[]> {
  const { data, error } = await supabase
    .from('document_comments')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function addDocumentComment(comment: Omit<DocumentComment, 'id' | 'created_at'>): Promise<DocumentComment> {
  const { data, error } = await supabase
    .from('document_comments')
    .insert({
      document_id: comment.document_id,
      user_id: comment.user_id,
      content: comment.content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Invoices
export async function getInvoices(): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    event_id: row.event_id,
    provider_id: row.provider_id,
    file_path: row.file_path || null, // Handle null for proformas
    amount: row.amount ? parseFloat(row.amount) : null,
    status: row.status,
    created_at: row.created_at,
    payment_date: row.payment_date,
  }));
}

export async function getInvoicesByProvider(providerId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    event_id: row.event_id,
    provider_id: row.provider_id,
    file_path: row.file_path || null, // Handle null for proformas
    amount: row.amount ? parseFloat(row.amount) : null,
    status: row.status,
    created_at: row.created_at,
    payment_date: row.payment_date,
  }));
}

export async function uploadInvoice(
  invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>,
  adminEmail?: string
): Promise<Invoice> {
  // If adminEmail is provided, use simple RPC function to bypass RLS (for mock auth)
  if (adminEmail) {
    const { data: invoiceId, error } = await supabase.rpc('create_proforma_invoice', {
      event_id_param: invoice.event_id,
      provider_id_param: invoice.provider_id,
      amount_param: invoice.amount || 0,
      admin_email_param: adminEmail,
    });

    if (error) {
      console.error('Invoice insert error (RPC):', error);
      throw error;
    }

    if (!invoiceId) {
      throw new Error('No invoice ID returned from create_proforma_invoice');
    }

    // Return the invoice with the ID we got - we'll let the store reload to get full data
    // This avoids RLS issues when fetching immediately after creation
    return {
      id: invoiceId,
      event_id: invoice.event_id,
      provider_id: invoice.provider_id,
      file_path: null,
      amount: invoice.amount,
      status: 'proforma' as const,
      created_at: new Date().toISOString(),
      payment_date: undefined,
    };
  }

  // Otherwise, use normal insert (for Supabase auth)
  const { data, error } = await supabase
    .from('invoices')
    .insert({
      event_id: invoice.event_id,
      provider_id: invoice.provider_id,
      file_path: invoice.file_path || null, // Allow null for proformas
      amount: invoice.amount,
      status: invoice.status || 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Invoice insert error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw error;
  }
  
  return {
    id: data.id,
    event_id: data.event_id,
    provider_id: data.provider_id,
    file_path: data.file_path || null, // Handle null for proformas
    amount: data.amount ? parseFloat(data.amount) : null,
    status: data.status,
    created_at: data.created_at,
    payment_date: data.payment_date,
  };
}

export async function updateInvoiceStatus(id: string, status: 'pending' | 'approved' | 'paid' | 'proforma', paymentDate?: string): Promise<Invoice> {
  const updateData: any = { status };
  if (paymentDate) updateData.payment_date = paymentDate;

  const { data, error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    event_id: data.event_id,
    provider_id: data.provider_id,
    file_path: data.file_path || null, // Handle null for proformas
    amount: data.amount ? parseFloat(data.amount) : null,
    status: data.status,
    created_at: data.created_at,
    payment_date: data.payment_date,
  };
}

// Event Templates
export async function getEventTemplates(): Promise<EventTemplate[]> {
  const { data, error } = await supabase
    .from('event_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    name: row.name,
    location: row.location,
    requirements: {
      managers: row.requirements_managers,
      supervisors: row.requirements_supervisors,
      sia: row.requirements_sia,
      stewards: row.requirements_stewards,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createEventTemplate(template: Omit<EventTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EventTemplate> {
  const { data, error } = await supabase
    .from('event_templates')
    .insert({
      name: template.name,
      location: template.location || '',
      requirements_managers: template.requirements.managers,
      requirements_supervisors: template.requirements.supervisors,
      requirements_sia: template.requirements.sia,
      requirements_stewards: template.requirements.stewards,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    location: data.location,
    requirements: {
      managers: data.requirements_managers,
      supervisors: data.requirements_supervisors,
      sia: data.requirements_sia,
      stewards: data.requirements_stewards,
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function updateEventTemplate(id: string, updates: Partial<EventTemplate>): Promise<EventTemplate> {
  const updateData: any = {};
  if (updates.name) updateData.name = updates.name;
  if (updates.location) updateData.location = updates.location;
  if (updates.requirements) {
    updateData.requirements_managers = updates.requirements.managers;
    updateData.requirements_supervisors = updates.requirements.supervisors;
    updateData.requirements_sia = updates.requirements.sia;
    updateData.requirements_stewards = updates.requirements.stewards;
  }

  const { data, error } = await supabase
    .from('event_templates')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    location: data.location,
    requirements: {
      managers: data.requirements_managers,
      supervisors: data.requirements_supervisors,
      sia: data.requirements_sia,
      stewards: data.requirements_stewards,
    },
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function deleteEventTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('event_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Activity Logs
export async function getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    user_id: row.user_id,
    action: row.action,
    entity_type: row.entity_type,
    entity_id: row.entity_id,
    details: row.details || {},
    created_at: row.created_at,
  }));
}

export async function addActivityLog(log: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: log.user_id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      details: log.details || {},
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    user_id: data.user_id,
    action: data.action,
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    details: data.details || {},
    created_at: data.created_at,
  };
}

export async function backfillAssignmentActivityLogs(): Promise<{ accepted: number; declined: number }> {
  // Get all accepted and declined assignments
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('id, provider_id, event_id, status, accepted_at, created_at, updated_at')
    .in('status', ['accepted', 'declined']);

  if (assignmentsError) throw assignmentsError;
  if (!assignments || assignments.length === 0) {
    return { accepted: 0, declined: 0 };
  }

  // Get existing activity logs for these assignments
  const assignmentIds = assignments.map(a => a.id);
  const { data: existingLogs, error: logsError } = await supabase
    .from('activity_logs')
    .select('entity_id, action')
    .eq('entity_type', 'assignment')
    .in('entity_id', assignmentIds)
    .in('action', ['assignment_accepted', 'assignment_declined']);

  if (logsError) throw logsError;

  // Create a set of assignment IDs that already have logs
  const existingLogSet = new Set(
    (existingLogs || []).map(log => `${log.entity_id}_${log.action}`)
  );

  // Get all providers to map provider_id to user_id
  const { data: providers, error: providersError } = await supabase
    .from('providers')
    .select('id, user_id');

  if (providersError) throw providersError;
  const providerMap = new Map((providers || []).map(p => [p.id, p.user_id]));

  // Prepare logs to insert
  const logsToInsert: Array<{
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: any;
    created_at?: string;
  }> = [];

  let acceptedCount = 0;
  let declinedCount = 0;

  for (const assignment of assignments) {
    const action = assignment.status === 'accepted' ? 'assignment_accepted' : 'assignment_declined';
    const logKey = `${assignment.id}_${action}`;
    
    if (existingLogSet.has(logKey)) {
      continue; // Skip if log already exists
    }

    const providerUserId = providerMap.get(assignment.provider_id) || 'provider';
    
    // Use accepted_at for accepted assignments, or updated_at/created_at for declined
    const timestamp = assignment.status === 'accepted' && assignment.accepted_at
      ? assignment.accepted_at
      : assignment.updated_at || assignment.created_at;

    logsToInsert.push({
      user_id: providerUserId,
      action: action,
      entity_type: 'assignment',
      entity_id: assignment.id,
      details: {
        event_id: assignment.event_id,
        provider_id: assignment.provider_id,
      },
      created_at: timestamp,
    });

    if (assignment.status === 'accepted') {
      acceptedCount++;
    } else {
      declinedCount++;
    }
  }

  // Insert all logs in batch
  if (logsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('activity_logs')
      .insert(logsToInsert);

    if (insertError) throw insertError;
  }

  return { accepted: acceptedCount, declined: declinedCount };
}

// Notifications
export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read,
    created_at: row.created_at,
    link: row.link,
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
  return count || 0;
}

export async function addNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
  // Check if we have a session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated. Please log in again.');
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read || false,
      link: notification.link,
    })
    .select()
    .single();

  if (error) {
    console.error('Notification insert error:', error);
    console.error('Session:', session ? 'exists' : 'missing');
    console.error('Auth user:', session?.user?.id);
    throw error;
  }
  return {
    id: data.id,
    user_id: data.user_id,
    type: data.type,
    title: data.title,
    message: data.message,
    read: data.read,
    created_at: data.created_at,
    link: data.link,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);

  if (error) throw error;
}

// Onboarding Documents
export async function getAllOnboardingDocuments(): Promise<OnboardingDocument[]> {
  const { data, error } = await supabase
    .from('onboarding_documents')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    provider_id: row.provider_id,
    document_type: row.document_type,
    title: row.document_type === 'contractor_agreement' ? 'Security Labour Provider Agreement' : 'Non-Disclosure Agreement',
    content: row.content,
    file_path: undefined,
    required: true,
    completed: !!row.signature,
    completed_at: row.signed_at,
    signature: row.signature,
    signed_name: undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function getOnboardingDocuments(providerId: string): Promise<OnboardingDocument[]> {
  const { data, error } = await supabase
    .from('onboarding_documents')
    .select('*')
    .eq('provider_id', providerId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(row => ({
    id: row.id,
    provider_id: row.provider_id,
    document_type: row.document_type,
    title: row.document_type === 'contractor_agreement' ? 'Security Labour Provider Agreement' : 'Non-Disclosure Agreement',
    content: row.content,
    file_path: undefined, // Not stored in DB, generated on demand
    required: true,
    completed: !!row.signature,
    completed_at: row.signed_at,
    signature: row.signature,
    signed_name: undefined, // Can be extracted from signature if needed
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function createOnboardingDocument(doc: Omit<OnboardingDocument, 'id' | 'created_at' | 'updated_at'>): Promise<OnboardingDocument> {
  const { data, error } = await supabase
    .from('onboarding_documents')
    .insert({
      provider_id: doc.provider_id,
      document_type: doc.document_type,
      content: doc.content,
    })
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    provider_id: data.provider_id,
    document_type: data.document_type,
    title: data.document_type === 'contractor_agreement' ? 'Security Labour Provider Agreement' : 'Non-Disclosure Agreement',
    content: data.content,
    file_path: undefined,
    required: true,
    completed: false,
    signature: undefined,
    signed_name: undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function completeOnboardingDocument(id: string, signature: string, signedName?: string): Promise<OnboardingDocument> {
  const { data, error } = await supabase
    .from('onboarding_documents')
    .update({
      signature,
      signed_name: signedName,
      signed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    id: data.id,
    provider_id: data.provider_id,
    document_type: data.document_type,
    title: data.document_type === 'contractor_agreement' ? 'Security Labour Provider Agreement' : 'Non-Disclosure Agreement',
    content: data.content,
    file_path: undefined,
    required: true,
    completed: true,
    completed_at: data.signed_at || undefined,
    signature: data.signature || undefined,
    signed_name: undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function isProviderOnboarded(providerId: string): Promise<boolean> {
  // 1) Provider must be approved
  const { data: provider, error: providerError } = await supabase
    .from('providers')
    .select('status')
    .eq('id', providerId)
    .single();
  
  if (providerError || !provider || provider.status !== 'approved') return false;

  // 2) All required onboarding documents must be completed (e.g., agreement + NDA)
  // We check if there are any documents, and if they are all signed.
  // Note: We assume all documents in this table are required for now.
  const { data: docs, error: docsError } = await supabase
    .from('onboarding_documents')
    .select('id, signature')
    .eq('provider_id', providerId);

  if (docsError) {
    console.error('Error checking onboarding docs:', docsError);
    return false;
  }

  // If no documents exist:
  // - If status is 'approved', assume legacy/manual approval (or pre-system onboarding) -> return TRUE
  // - If status is not 'approved' (e.g. pending), they need to generate/sign -> return FALSE
  if (!docs || docs.length === 0) {
    return provider.status === 'approved';
  }

  // Check if every document has a signature
  const allCompleted = docs.every((d) => !!d.signature);
  return allCompleted;
}

// Timesheet Confirmation
export async function confirmTimesheets(assignmentId: string, file: File): Promise<void> {
  // 1. Get the assignment to know event and provider
  const assignment = await getAssignment(assignmentId);
  if (!assignment) throw new Error('Assignment not found');

  const provider = await getProvider(assignment.provider_id);
  if (!provider) throw new Error('Provider not found');

  // 2. Upload file
  const fileName = `timesheets-${assignmentId}-${Date.now()}.${file.name.split('.').pop()}`;
  const path = `assignments/${assignmentId}/${fileName}`;
  const { fullPath } = await uploadFile(STORAGE_BUCKETS.DOCUMENTS, path, file);

  // 3. Update assignment status
  const { error: updateError } = await supabase
    .from('assignments')
    .update({
      timesheets_confirmed: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', assignmentId);

  if (updateError) throw updateError;

  // 4. Send message with attachment
  // We need the admin user ID (current user) and provider user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await sendMessage({
    sender_id: user.id,
    receiver_id: provider.user_id,
    content: 'Timesheets have been confirmed. You can now submit your invoice.',
    attachment_path: fullPath,
    attachment_name: file.name,
    attachment_type: file.type,
  });

  // 5. Create notification
  await addNotification({
    user_id: provider.user_id,
    type: 'assignment',
    title: 'Timesheets Confirmed',
    message: 'Your timesheets have been confirmed. You may now submit your invoice.',
    link: `/provider/events/${assignment.event_id}`,
    read: false,
  });
}

async function getAssignment(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return transformAssignment(data);
}


