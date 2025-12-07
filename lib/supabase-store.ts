'use client';

import { create } from 'zustand';
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
  User,
} from '@/lib/types';
import * as supabaseData from '@/lib/supabase/data';
import { getCurrentUser } from '@/lib/supabase/auth';

interface SupabaseDataStore {
  // State
  currentUser: User | null;
  events: Event[];
  providers: Provider[];
  assignments: Assignment[];
  availability: ProviderAvailability[];
  staffDetails: StaffDetail[];
  staffTimes: StaffTimes[];
  messages: Message[];
  documents: Document[];
  invoices: Invoice[];
  eventTemplates: EventTemplate[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  onboardingDocuments: OnboardingDocument[];
  unreadMessageCount: number;
  
  // Loading states
  isLoading: boolean;
  
  // Actions - User
  setCurrentUser: (user: User | null) => void;
  loadCurrentUser: () => Promise<void>;
  
  // Actions - Events
  loadEvents: () => Promise<void>;
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Promise<Event>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  
  // Actions - Providers
  loadProviders: () => Promise<void>;
  createProvider: (provider: Omit<Provider, 'id'>) => Promise<Provider>;
  updateProvider: (id: string, updates: Partial<Provider>) => Promise<void>;
  updateProviderDetails: (id: string, details: Partial<Provider>) => Promise<void>;
  approveProvider: (id: string) => Promise<void>;
  rejectProvider: (id: string, reason?: string) => Promise<void>;
  getPendingProviders: () => Provider[];
  
  // Actions - Assignments
  loadAssignments: () => Promise<void>;
  createAssignment: (assignment: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => Promise<Assignment>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  acceptAssignment: (id: string) => Promise<void>;
  declineAssignment: (id: string) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  confirmTimesheets: (assignmentId: string, file: File) => Promise<void>;
  // Availability
  loadProviderAvailability: (providerId: string) => Promise<void>;
  loadEventAvailability: (eventId: string) => Promise<void>;
  setProviderAvailability: (providerId: string, eventId: string, status: 'available' | 'unavailable') => Promise<ProviderAvailability>;
  getAvailabilityForEvent: (eventId: string) => ProviderAvailability[];
  getAvailabilityForProvider: (providerId: string) => ProviderAvailability[];
  
  // Actions - Staff Details
  loadStaffDetails: (assignmentId: string) => Promise<void>;
  addStaffDetail: (staff: Omit<StaffDetail, 'id' | 'created_at'>) => Promise<void>;
  addStaffDetails: (staffList: Omit<StaffDetail, 'id' | 'created_at'>[]) => Promise<void>;
  
  // Actions - Staff Times
  loadStaffTimes: (assignmentId: string) => Promise<void>;
  createStaffTimes: (staffTimes: Omit<StaffTimes, 'id' | 'created_at' | 'updated_at' | 'sent_at'> & { sent_at?: string }) => Promise<StaffTimes>;
  deleteStaffTimesByAssignment: (assignmentId: string) => Promise<void>;
  
  // Actions - Messages
  loadMessages: (senderId: string, receiverId: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'created_at'>) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  deleteConversation: (userA: string, userB: string) => Promise<void>;
  loadUnreadMessageCount: () => Promise<void>;
  markConversationRead: (otherUserId: string) => Promise<void>;
  
  // Actions - Documents
  loadDocuments: (eventId: string, providerId?: string | null) => Promise<void>;
  uploadDocument: (document: Omit<Document, 'id' | 'created_at'>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  
  // Actions - Document Comments
  loadDocumentComments: (documentId: string) => Promise<void>;
  addDocumentComment: (comment: Omit<DocumentComment, 'id' | 'created_at'>) => Promise<void>;
  
  // Actions - Invoices
  loadInvoices: () => Promise<void>;
  uploadInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>, adminEmail?: string) => Promise<Invoice>;
  updateInvoiceStatus: (id: string, status: 'pending' | 'approved' | 'paid' | 'proforma', paymentDate?: string) => Promise<void>;
  
  // Actions - Event Templates
  loadEventTemplates: () => Promise<void>;
  createEventTemplate: (template: Omit<EventTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<EventTemplate>;
  updateEventTemplate: (id: string, updates: Partial<EventTemplate>) => Promise<void>;
  deleteEventTemplate: (id: string) => Promise<void>;
  createEventFromTemplate: (templateId: string, date: string, name?: string) => Promise<Event>;
  
  // Actions - Activity Logs
  loadActivityLogs: () => Promise<void>;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => Promise<void>;
  getActivityLogs: (filters?: { entity_type?: string; entity_id?: string; user_id?: string }) => ActivityLog[];
  backfillAssignmentActivityLogs: () => Promise<{ accepted: number; declined: number }>;
  
  // Actions - Notifications
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  getUnreadNotificationCount: () => Promise<number>;
  
  // Actions - Onboarding
  loadOnboardingDocuments: (providerId: string) => Promise<void>;
  loadAllOnboardingDocuments: () => Promise<void>;
  createOnboardingDocument: (doc: Omit<OnboardingDocument, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  completeOnboardingDocument: (id: string, signature: string, signedName?: string) => Promise<void>;
  isProviderOnboarded: (providerId: string) => Promise<boolean>;
  
  // Helper getters
  getEvent: (id: string) => Event | undefined;
  getProvider: (id: string) => Provider | undefined;
  getProviderByUserId: (userId: string) => Provider | undefined;
  getAssignmentsByEvent: (eventId: string) => Assignment[];
  getAssignmentsByProvider: (providerId: string) => Assignment[];
  getStaffDetailsByAssignment: (assignmentId: string) => StaffDetail[];
  getStaffTimesByAssignment: (assignmentId: string) => StaffTimes[];
  getMessages: (senderId: string, receiverId: string) => Message[];
  getDocumentsByEvent: (eventId: string, providerId?: string | null) => Document[];
  getInvoicesByProvider: (providerId: string) => Invoice[];
  getDocumentComments: (documentId: string) => DocumentComment[];
  getOnboardingDocuments: (providerId: string) => OnboardingDocument[];
}

export const useSupabaseDataStore = create<SupabaseDataStore>((set, get) => ({
  // Initial state
  currentUser: null,
  events: [],
  providers: [],
  assignments: [],
  staffDetails: [],
  staffTimes: [],
  messages: [],
  documents: [],
  invoices: [],
  eventTemplates: [],
  activityLogs: [],
  notifications: [],
  onboardingDocuments: [],
  availability: [],
  unreadMessageCount: 0,
  isLoading: false,

  // User actions
  setCurrentUser: (user) => set({ currentUser: user }),
  loadCurrentUser: async () => {
    const user = await getCurrentUser();
    set({ currentUser: user });
    if (user) {
      try {
        await get().loadUnreadMessageCount();
      } catch (err) {
        console.error('Error loading unread messages:', err);
      }
    }
  },

  // Event actions
  loadEvents: async () => {
    set({ isLoading: true });
    try {
      const events = await supabaseData.getEvents();
      set({ events, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  createEvent: async (event) => {
    const newEvent = await supabaseData.createEvent(event);
    set((state) => ({ events: [...state.events, newEvent] }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'event_created',
        entity_type: 'event',
        entity_id: newEvent.id,
        details: { name: newEvent.name, date: newEvent.date },
      });
    } catch (err) {
      console.error('Error logging event creation:', err);
    }
    return newEvent;
  },
  updateEvent: async (id, updates) => {
    const updated = await supabaseData.updateEvent(id, updates);
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? updated : e)),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'event_updated',
        entity_type: 'event',
        entity_id: id,
        details: updates,
      });
    } catch (err) {
      console.error('Error logging event update:', err);
    }
    return updated;
  },
  deleteEvent: async (id) => {
    await supabaseData.deleteEvent(id);
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      assignments: state.assignments.filter((a) => a.event_id !== id),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'event_deleted',
        entity_type: 'event',
        entity_id: id,
        details: {},
      });
    } catch (err) {
      console.error('Error logging event deletion:', err);
    }
  },
  getEvent: (id) => get().events.find((e) => e.id === id),

  // Provider actions
  loadProviders: async () => {
    set({ isLoading: true });
    try {
      const providers = await supabaseData.getProviders();
      set({ providers, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  createProvider: async (provider) => {
    const newProvider = await supabaseData.createProvider(provider);
    set((state) => ({ providers: [...state.providers, newProvider] }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'provider_created',
        entity_type: 'provider',
        entity_id: newProvider.id,
        details: { provider_id: newProvider.id, email: newProvider.contact_email },
      });
    } catch (err) {
      console.error('Error logging provider creation:', err);
    }
    return newProvider;
  },
  updateProvider: async (id, updates) => {
    const updated = await supabaseData.updateProvider(id, updates);
    set((state) => ({
      providers: state.providers.map((p) => (p.id === id ? updated : p)),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'provider_updated',
        entity_type: 'provider',
        entity_id: id,
        details: updates,
      });
    } catch (err) {
      console.error('Error logging provider update:', err);
    }
  },
  updateProviderDetails: async (id, details) => {
    const updated = await supabaseData.updateProvider(id, details);
    set((state) => ({
      providers: state.providers.map((p) => (p.id === id ? updated : p)),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'provider_updated',
        entity_type: 'provider',
        entity_id: id,
        details: details,
      });
    } catch (err) {
      console.error('Error logging provider detail update:', err);
    }
  },
  approveProvider: async (id) => {
    await supabaseData.approveProvider(id);
    await get().loadProviders();
    try {
      await get().addActivityLog({
        user_id: 'admin',
        action: 'provider_approved',
        entity_type: 'provider',
        entity_id: id,
        details: { provider_id: id },
      });
    } catch (err) {
      console.error('Error logging provider approval:', err);
    }
  },
  rejectProvider: async (id, reason) => {
    await supabaseData.rejectProvider(id, reason);
    await get().loadProviders();
    try {
      await get().addActivityLog({
        user_id: 'admin',
        action: 'provider_rejected',
        entity_type: 'provider',
        entity_id: id,
        details: { provider_id: id, reason },
      });
    } catch (err) {
      console.error('Error logging provider rejection:', err);
    }
  },
  getPendingProviders: () => {
    // A provider is pending if status is 'pending' OR if 'approved' but not fully onboarded (documents missing/unsigned)
    // Note: Since getting documents is async, we rely on the provider status primarily.
    // However, if we want to show approved-but-not-onboarded providers as pending, we would need to check documents.
    // For the dashboard, we stick to status='pending' to match the database state, but the UI might need to reflect 'Pending Documents'.
    return get().providers.filter((p) => p.status === 'pending');
  },
  getProvider: (id) => get().providers.find((p) => p.id === id),
  getProviderByUserId: (userId) => get().providers.find((p) => p.user_id === userId),

  // Assignment actions
  loadAssignments: async () => {
    set({ isLoading: true });
    try {
      const assignments = await supabaseData.getAssignments();
      set({ assignments, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  createAssignment: async (assignment) => {
    const newAssignment = await supabaseData.createAssignment(assignment);
    set((state) => ({ assignments: [...state.assignments, newAssignment] }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'assignment_created',
        entity_type: 'assignment',
        entity_id: newAssignment.id,
        details: { event_id: newAssignment.event_id, provider_id: newAssignment.provider_id },
      });
    } catch (err) {
      console.error('Error logging assignment creation:', err);
    }
    return newAssignment;
  },
  updateAssignment: async (id, updates) => {
    const updated = await supabaseData.updateAssignment(id, updates);
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? updated : a)),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'assignment_updated',
        entity_type: 'assignment',
        entity_id: id,
        details: updates,
      });
    } catch (err) {
      console.error('Error logging assignment update:', err);
    }
  },
  acceptAssignment: async (id) => {
    const updated = await supabaseData.acceptAssignment(id);
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? updated : a)),
    }));
    try {
      // Get the provider's user_id for the activity log
      const provider = get().providers.find((p) => p.id === updated.provider_id);
      await get().addActivityLog({
        user_id: provider?.user_id || get().currentUser?.id || 'provider',
        action: 'assignment_accepted',
        entity_type: 'assignment',
        entity_id: id,
        details: { event_id: updated.event_id, provider_id: updated.provider_id },
      });
    } catch (err) {
      console.error('Error logging assignment acceptance:', err);
    }
  },
  declineAssignment: async (id) => {
    const updated = await supabaseData.declineAssignment(id);
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === id ? updated : a)),
    }));
    try {
      // Get the provider's user_id for the activity log
      const provider = get().providers.find((p) => p.id === updated.provider_id);
      await get().addActivityLog({
        user_id: provider?.user_id || get().currentUser?.id || 'provider',
        action: 'assignment_declined',
        entity_type: 'assignment',
        entity_id: id,
        details: { event_id: updated.event_id, provider_id: updated.provider_id },
      });
    } catch (err) {
      console.error('Error logging assignment decline:', err);
    }
  },
  deleteAssignment: async (id) => {
    await supabaseData.deleteAssignment(id);
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== id),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'assignment_deleted',
        entity_type: 'assignment',
        entity_id: id,
        details: {},
      });
    } catch (err) {
      console.error('Error logging assignment deletion:', err);
    }
  },
  confirmTimesheets: async (assignmentId, file) => {
    await supabaseData.confirmTimesheets(assignmentId, file);
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === assignmentId ? { ...a, timesheets_confirmed: true } : a
      ),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'timesheets_confirmed',
        entity_type: 'assignment',
        entity_id: assignmentId,
        details: { file_name: file.name },
      });
    } catch (err) {
      console.error('Error logging timesheet confirmation:', err);
    }
  },
  loadProviderAvailability: async (providerId) => {
    const avail = await supabaseData.getProviderAvailability(providerId);
    set((state) => {
      const other = state.availability.filter((a) => a.provider_id !== providerId);
      return { availability: [...other, ...avail] };
    });
  },
  loadEventAvailability: async (eventId) => {
    const avail = await supabaseData.getEventAvailability(eventId);
    set((state) => {
      const other = state.availability.filter((a) => a.event_id !== eventId);
      return { availability: [...other, ...avail] };
    });
  },
  setProviderAvailability: async (providerId, eventId, status) => {
    const updated = await supabaseData.upsertProviderAvailability(providerId, eventId, status);
    set((state) => {
      const other = state.availability.filter(
        (a) => !(a.provider_id === providerId && a.event_id === eventId)
      );
      return { availability: [...other, updated] };
    });
    // Log activity
    try {
      const provider = get().providers.find((p) => p.id === providerId);
      await get().addActivityLog({
        user_id: provider?.user_id || 'provider',
        action: 'availability_update',
        entity_type: 'event',
        entity_id: eventId,
        details: { provider_id: providerId, status },
      });
    } catch (err) {
      console.error('Error logging availability update:', err);
    }
    return updated;
  },
  getAvailabilityForEvent: (eventId) =>
    get().availability.filter((a) => a.event_id === eventId),
  getAvailabilityForProvider: (providerId) =>
    get().availability.filter((a) => a.provider_id === providerId),
  getAssignmentsByEvent: (eventId) => get().assignments.filter((a) => a.event_id === eventId),
  getAssignmentsByProvider: (providerId) => get().assignments.filter((a) => a.provider_id === providerId),

  // Staff Details actions
  loadStaffDetails: async (assignmentId) => {
    const details = await supabaseData.getStaffDetailsByAssignment(assignmentId);
    set((state) => {
      const existing = state.staffDetails.filter((s) => s.assignment_id !== assignmentId);
      return { staffDetails: [...existing, ...details] };
    });
  },
  addStaffDetail: async (staff) => {
    const newStaff = await supabaseData.addStaffDetail(staff);
    set((state) => ({ staffDetails: [...state.staffDetails, newStaff] }));
  },
  addStaffDetails: async (staffList) => {
    const newStaff = await supabaseData.addStaffDetails(staffList);
    set((state) => ({ staffDetails: [...state.staffDetails, ...newStaff] }));
  },
  getStaffDetailsByAssignment: (assignmentId) =>
    get().staffDetails.filter((s) => s.assignment_id === assignmentId),

  // Staff Times actions
  loadStaffTimes: async (assignmentId) => {
    const staffTimesList = await supabaseData.getStaffTimesByAssignment(assignmentId);
    set((state) => {
      const existing = state.staffTimes.filter((s) => s.assignment_id !== assignmentId);
      return { staffTimes: [...existing, ...staffTimesList] };
    });
  },
  createStaffTimes: async (staffTimes) => {
    const newStaffTimes = await supabaseData.createStaffTimes(staffTimes);
    set((state) => ({ staffTimes: [...state.staffTimes, newStaffTimes] }));
    return newStaffTimes;
  },
  deleteStaffTimesByAssignment: async (assignmentId) => {
    await supabaseData.deleteStaffTimesByAssignment(assignmentId);
    set((state) => ({
      staffTimes: state.staffTimes.filter((s) => s.assignment_id !== assignmentId),
    }));
  },
  getStaffTimesByAssignment: (assignmentId) =>
    get().staffTimes.filter((s) => s.assignment_id === assignmentId).sort((a, b) => a.shift_number - b.shift_number),

  // Message actions
  loadMessages: async (senderId, receiverId) => {
    const messages = await supabaseData.getMessages(senderId, receiverId);
    set((state) => {
      // Remove existing messages for this conversation and replace with fresh data
      const otherMessages = state.messages.filter(
        (m) =>
          !(
            (m.sender_id === senderId && m.receiver_id === receiverId) ||
            (m.sender_id === receiverId && m.receiver_id === senderId)
          )
      );
      return { messages: [...otherMessages, ...messages] };
    });
  },
  sendMessage: async (message) => {
    const newMessage = await supabaseData.sendMessage(message);
    set((state) => ({ messages: [...state.messages, newMessage] }));
    try {
      // Resolve names for logging/notifications
      const store = get();
      const receiverProvider = store.providers.find((p) => p.user_id === newMessage.receiver_id);
      const senderProvider = store.providers.find((p) => p.user_id === newMessage.sender_id);
      const receiverName = receiverProvider?.company_name || (newMessage.receiver_id === 'admin' ? 'Admin' : '');
      const senderName = senderProvider?.company_name || store.currentUser?.email || '';

      // Determine action: "message_sent" only if sender is admin, otherwise "message_received"
      const isAdminSender = store.currentUser?.role === 'admin';
      const action = isAdminSender ? 'message_sent' : 'message_received';

      await get().addActivityLog({
        user_id: get().currentUser?.id || message.sender_id,
        action: action,
        entity_type: 'message',
        entity_id: newMessage.id,
        details: { 
          receiver_id: newMessage.receiver_id, 
          receiver_name: receiverName, 
          sender_id: newMessage.sender_id, 
          sender_name: senderName,
          content: newMessage.content // Include message content
        },
      });
      // Notify receiver (best-effort, RLS-safe)
      try {
        const receiverProviderId = receiverProvider?.id;
        const senderProviderId = senderProvider?.id;
        const receiverLink =
          get().currentUser?.role === 'admin'
            ? '/admin/messages'
            : '/provider/messages';
        const adminLink =
          senderProviderId && get().currentUser?.role === 'admin'
            ? `/admin/messages?providerId=${senderProviderId}`
            : receiverLink;

        await get().addNotification({
          user_id: newMessage.receiver_id,
          type: 'message',
          title: 'New message',
          message: receiverName ? `New message for ${receiverName}` : `You received a new message`,
          link: get().currentUser?.role === 'admin' ? adminLink : receiverLink,
          read: false,
        });
      } catch (notifyErr) {
        console.warn('Notification insert skipped:', notifyErr);
      }
      // Refresh receiver unread count if current user is receiver
      if (get().currentUser?.id === newMessage.receiver_id) {
        await get().loadUnreadMessageCount();
      }
    } catch (err) {
      console.error('Error logging message send:', err);
    }
  },
  deleteMessage: async (id) => {
    await supabaseData.deleteMessage(id);
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },
  deleteConversation: async (userA, userB) => {
    await supabaseData.deleteConversation(userA, userB);
    set((state) => ({
      messages: state.messages.filter(
        (m) =>
          !(
            (m.sender_id === userA && m.receiver_id === userB) ||
            (m.sender_id === userB && m.receiver_id === userA)
          )
      ),
    }));
  },
  loadUnreadMessageCount: async () => {
    const user = get().currentUser;
    if (!user) return;
    const count = await supabaseData.getUnreadMessageCount(user.id);
    set({ unreadMessageCount: count });
  },
  markConversationRead: async (otherUserId) => {
    const user = get().currentUser;
    if (!user) return;
    await supabaseData.markConversationRead(user.id, otherUserId);
    await get().loadUnreadMessageCount();
    await get().loadMessages(user.id, otherUserId);
  },
  getMessages: (senderId, receiverId) => {
    // Always fetch fresh from Supabase to ensure we have latest
    // For now, return from store, but in production you might want to always fetch
    return get().messages.filter(
      (m) =>
        (m.sender_id === senderId && m.receiver_id === receiverId) ||
        (m.sender_id === receiverId && m.receiver_id === senderId)
    );
  },

  // Document actions
  loadDocuments: async (eventId, providerId?) => {
    const documents = await supabaseData.getDocumentsByEvent(eventId, providerId);
    set((state) => {
      const existing = state.documents.filter((d) => d.event_id !== eventId);
      return { documents: [...existing, ...documents] };
    });
  },
  uploadDocument: async (document) => {
    const newDoc = await supabaseData.uploadDocument(document);
    set((state) => ({ documents: [...state.documents, newDoc] }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'document_uploaded',
        entity_type: 'document',
        entity_id: newDoc.id,
        details: { event_id: newDoc.event_id, provider_id: newDoc.provider_id },
      });
    } catch (err) {
      console.error('Error logging document upload:', err);
    }
  },
  deleteDocument: async (id) => {
    await supabaseData.deleteDocument(id);
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'document_deleted',
        entity_type: 'document',
        entity_id: id,
        details: {},
      });
    } catch (err) {
      console.error('Error logging document deletion:', err);
    }
  },
  getDocumentsByEvent: (eventId, providerId?) => {
    const docs = get().documents.filter((d) => d.event_id === eventId);
    if (providerId !== undefined) {
      return docs.filter((d) => d.provider_id === providerId);
    }
    return docs;
  },

  // Document Comments actions
  loadDocumentComments: async (documentId) => {
    const comments = await supabaseData.getDocumentComments(documentId);
    // Store comments in document objects (simplified approach)
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === documentId ? { ...d, comments } : d
      ),
    }));
  },
  addDocumentComment: async (comment) => {
    const newComment = await supabaseData.addDocumentComment(comment);
    set((state) => ({
      documents: state.documents.map((d) =>
        d.id === comment.document_id
          ? { ...d, comments: [...(d.comments || []), newComment] }
          : d
      ),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'document_comment_added',
        entity_type: 'document',
        entity_id: comment.document_id,
        details: { user_id: comment.user_id },
      });
    } catch (err) {
      console.error('Error logging document comment:', err);
    }
  },
  getDocumentComments: (documentId) => {
    const doc = get().documents.find((d) => d.id === documentId);
    return doc?.comments || [];
  },

  // Invoice actions
  loadInvoices: async () => {
    set({ isLoading: true });
    try {
      const invoices = await supabaseData.getInvoices();
      set({ invoices, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  uploadInvoice: async (invoice, adminEmail) => {
    const newInvoice = await supabaseData.uploadInvoice(invoice, adminEmail);
    set((state) => ({ invoices: [...state.invoices, newInvoice] }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'invoice_created',
        entity_type: 'invoice',
        entity_id: newInvoice.id,
        details: { event_id: newInvoice.event_id, provider_id: newInvoice.provider_id, amount: newInvoice.amount },
      });
    } catch (err) {
      console.error('Error logging invoice creation:', err);
    }
    return newInvoice;
  },
  updateInvoiceStatus: async (id, status, paymentDate) => {
    const updated = await supabaseData.updateInvoiceStatus(id, status, paymentDate);
    set((state) => ({
      invoices: state.invoices.map((i) => (i.id === id ? updated : i)),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'invoice_updated',
        entity_type: 'invoice',
        entity_id: id,
        details: { status, paymentDate },
      });
    } catch (err) {
      console.error('Error logging invoice update:', err);
    }
  },
  getInvoicesByProvider: (providerId) => get().invoices.filter((i) => i.provider_id === providerId),

  // Event Template actions
  loadEventTemplates: async () => {
    set({ isLoading: true });
    try {
      const templates = await supabaseData.getEventTemplates();
      set({ eventTemplates: templates, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  createEventTemplate: async (template) => {
    const newTemplate = await supabaseData.createEventTemplate(template);
    set((state) => ({ eventTemplates: [...state.eventTemplates, newTemplate] }));
    return newTemplate;
  },
  updateEventTemplate: async (id, updates) => {
    const updated = await supabaseData.updateEventTemplate(id, updates);
    set((state) => ({
      eventTemplates: state.eventTemplates.map((t) => (t.id === id ? updated : t)),
    }));
  },
  deleteEventTemplate: async (id) => {
    await supabaseData.deleteEventTemplate(id);
    set((state) => ({
      eventTemplates: state.eventTemplates.filter((t) => t.id !== id),
    }));
  },
  createEventFromTemplate: async (templateId, date, name) => {
    const template = get().eventTemplates.find((t) => t.id === templateId);
    if (!template) throw new Error('Template not found');
    
    const event = await supabaseData.createEvent({
      name: name || template.name,
      location: template.location || '',
      date,
      requirements: template.requirements,
    });
    
    set((state) => ({ events: [...state.events, event] }));
    return event;
  },

  // Activity Log actions
  loadActivityLogs: async () => {
    const logs = await supabaseData.getActivityLogs();
    set({ activityLogs: logs });
    // Automatically backfill assignment activity logs if needed
    try {
      await supabaseData.backfillAssignmentActivityLogs();
      // Reload logs after backfill
      const updatedLogs = await supabaseData.getActivityLogs();
      set({ activityLogs: updatedLogs });
    } catch (err) {
      console.error('Error during assignment activity log backfill:', err);
      // Don't throw - backfill is optional
    }
  },
  backfillAssignmentActivityLogs: async () => {
    return await supabaseData.backfillAssignmentActivityLogs();
  },
  addActivityLog: async (log) => {
    const newLog = await supabaseData.addActivityLog(log);
    set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
  },
  getActivityLogs: (filters) => {
    let logs = get().activityLogs;
    if (filters?.entity_type) {
      logs = logs.filter((log) => log.entity_type === filters.entity_type);
    }
    if (filters?.entity_id) {
      logs = logs.filter((log) => log.entity_id === filters.entity_id);
    }
    if (filters?.user_id) {
      logs = logs.filter((log) => log.user_id === filters.user_id);
    }
    return logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // Notification actions
  loadNotifications: async () => {
    const user = get().currentUser;
    if (!user) return;
    
    const notifications = await supabaseData.getNotifications(user.id);
    set({ notifications });
  },
  addNotification: async (notification) => {
    const newNotification = await supabaseData.addNotification(notification);
    set((state) => ({ notifications: [newNotification, ...state.notifications] }));
  },
  markNotificationRead: async (id) => {
    await supabaseData.markNotificationRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  markAllNotificationsRead: async () => {
    const user = get().currentUser;
    if (!user) return;
    
    await supabaseData.markAllNotificationsRead(user.id);
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  getUnreadNotificationCount: async () => {
    const user = get().currentUser;
    if (!user) return 0;
    try {
      return await supabaseData.getUnreadNotificationCount(user.id);
    } catch (error) {
      console.error('Error getting unread count:', error);
      // Fallback to counting in store
      return get().notifications.filter(n => n.user_id === user.id && !n.read).length;
    }
  },

  // Onboarding actions
  loadOnboardingDocuments: async (providerId) => {
    try {
      const docs = await supabaseData.getOnboardingDocuments(providerId);
      set((state) => {
        const existing = state.onboardingDocuments.filter((d) => d.provider_id !== providerId);
        return { onboardingDocuments: [...existing, ...docs] };
      });
    } catch (error) {
      console.error('Error loading onboarding documents:', error);
    }
  },
  loadAllOnboardingDocuments: async () => {
    try {
      const docs = await supabaseData.getAllOnboardingDocuments();
      set({ onboardingDocuments: docs });
    } catch (error) {
      console.error('Error loading all onboarding documents:', error);
    }
  },
  createOnboardingDocument: async (doc) => {
    const newDoc = await supabaseData.createOnboardingDocument(doc);
    set((state) => ({ onboardingDocuments: [...state.onboardingDocuments, newDoc] }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'onboarding_document_created',
        entity_type: 'onboarding_document',
        entity_id: newDoc.id,
        details: { provider_id: newDoc.provider_id, type: newDoc.document_type },
      });
    } catch (err) {
      console.error('Error logging onboarding document creation:', err);
    }
  },
  completeOnboardingDocument: async (id, signature, signedName) => {
    const updated = await supabaseData.completeOnboardingDocument(id, signature, signedName);
    set((state) => ({
      onboardingDocuments: state.onboardingDocuments.map((d) =>
        d.id === id ? updated : d
      ),
    }));
    try {
      await get().addActivityLog({
        user_id: get().currentUser?.id || 'admin',
        action: 'onboarding_document_completed',
        entity_type: 'onboarding_document',
        entity_id: id,
        details: { provider_id: updated.provider_id, type: updated.document_type },
      });
    } catch (err) {
      console.error('Error logging onboarding document completion:', err);
    }
  },
  isProviderOnboarded: async (providerId) => {
    try {
      return await supabaseData.isProviderOnboarded(providerId);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },
  getOnboardingDocuments: (providerId) =>
    get().onboardingDocuments.filter((d) => d.provider_id === providerId),
}));

