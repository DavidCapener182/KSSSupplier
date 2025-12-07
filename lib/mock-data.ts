import { create } from 'zustand';
import type {
  Event,
  Provider,
  Assignment,
  StaffDetail,
  StaffTimes,
  Message,
  Document,
  Invoice,
  User,
  AssignmentStatus,
  EventTemplate,
  ActivityLog,
  Notification,
  OnboardingDocument,
  DocumentComment,
  ProviderAvailability,
} from './types';

interface MockDataStore {
  // Data
  events: Event[];
  providers: Provider[];
  assignments: Assignment[];
  staffDetails: StaffDetail[];
  staffTimes: StaffTimes[];
  availability: ProviderAvailability[];
  messages: Message[];
  documents: Document[];
  invoices: Invoice[];
  eventTemplates: EventTemplate[];
  activityLogs: ActivityLog[];
  notifications: Notification[];
  onboardingDocuments: OnboardingDocument[];
  reminders: any[];
  documentComments: DocumentComment[];
  currentUser: User | null;
  isLoading: boolean;

  // Actions
  setCurrentUser: (user: User | null) => void;
  loadEvents: () => Promise<void>;
  loadAssignments: () => Promise<void>;
  loadProviders: () => Promise<void>;
  loadInvoices: () => Promise<void>;
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => Event;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  createAssignment: (assignment: Omit<Assignment, 'id'>) => Assignment;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  acceptAssignment: (id: string) => Promise<void>;
  declineAssignment: (id: string) => Promise<void>;
  confirmTimesheets: (assignmentId: string, file: File) => Promise<void>;
  loadStaffDetails: (assignmentId: string) => Promise<void>;
  addStaffDetail: (detail: Omit<StaffDetail, 'id'>) => StaffDetail;
  getStaffDetailsByAssignment: (assignmentId: string) => StaffDetail[];
  loadStaffTimes: (assignmentId: string) => Promise<void>;
  createStaffTimes: (staffTimes: Omit<StaffTimes, 'id' | 'created_at' | 'updated_at' | 'sent_at'> & { sent_at?: string }) => Promise<StaffTimes>;
  deleteStaffTimesByAssignment: (assignmentId: string) => Promise<void>;
  getStaffTimesByAssignment: (assignmentId: string) => StaffTimes[];
  sendMessage: (message: Omit<Message, 'id' | 'timestamp' | 'created_at'>) => Message;
  getMessages: (userId1: string, userId2: string) => Message[];
  uploadDocument: (document: Omit<Document, 'id' | 'created_at'>) => Document | Promise<Document>;
  getDocumentsByEvent: (eventId: string, providerId?: string) => Document[];
  loadDocuments: (eventId: string, providerId?: string) => Promise<void>;
  addDocumentComment: (comment: Omit<DocumentComment, 'id' | 'created_at'>) => DocumentComment | Promise<DocumentComment>;
  getDocumentComments: (documentId: string) => DocumentComment[];
  uploadInvoice: (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>, adminEmail?: string) => Invoice;
  updateInvoiceStatus: (id: string, status: Invoice['status'], paymentDate?: string) => Promise<void>;
  getInvoicesByProvider: (providerId: string) => Invoice[];
  getInvoicesByEvent: (eventId: string) => Invoice[];
  // Event Template actions
  createEventTemplate: (template: Omit<EventTemplate, 'id' | 'created_at' | 'updated_at'>) => EventTemplate;
  updateEventTemplate: (id: string, updates: Partial<EventTemplate>) => void;
  deleteEventTemplate: (id: string) => void;
  createEventFromTemplate: (templateId: string, date: string, name?: string) => Event;
  // Activity Log actions
  loadActivityLogs: () => Promise<void>;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => ActivityLog;
  getActivityLogs: (filters?: { entity_type?: string; entity_id?: string; user_id?: string }) => ActivityLog[];
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'created_at'>) => Notification;
  getNotifications: (userId: string) => Notification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  getUnreadNotificationCount: (userId: string) => number;
  // Onboarding actions
  loadOnboardingDocuments: (providerId: string) => Promise<void>;
  loadAllOnboardingDocuments: () => Promise<void>;
  getOnboardingDocuments: (providerId: string) => OnboardingDocument[];
  createOnboardingDocument: (doc: Omit<OnboardingDocument, 'id' | 'created_at' | 'updated_at'>) => OnboardingDocument;
  completeOnboardingDocument: (id: string, signature?: string, signedName?: string) => void;
  isProviderOnboarded: (providerId: string) => boolean;
  updateProviderDetails: (id: string, details: Partial<Provider>) => Promise<void>;
  approveProvider: (id: string) => Promise<void>;
  rejectProvider: (id: string, reason?: string) => Promise<void>;
  getPendingProviders: () => Provider[];
  // Availability
  loadProviderAvailability: (providerId: string) => Promise<void>;
  loadEventAvailability: (eventId: string) => Promise<void>;
  setProviderAvailability: (providerId: string, eventId: string, status: 'available' | 'unavailable') => ProviderAvailability;
  getAvailabilityForEvent: (eventId: string) => ProviderAvailability[];
  getAvailabilityForProvider: (providerId: string) => ProviderAvailability[];
}

// Initial mock data - Events removed, will be loaded from Supabase
const initialEvents: Event[] = [];

const initialProviders: Provider[] = [
  {
    id: 'provider-1',
    company_name: 'Security Solutions Ltd',
    contact_email: 'contact@securitysolutions.com',
    user_id: 'user-provider-1',
  },
  {
    id: 'provider-2',
    company_name: 'Event Staffing Co',
    contact_email: 'info@eventstaffing.co.uk',
    user_id: 'user-provider-2',
  },
  {
    id: 'provider-3',
    company_name: 'Premier Security Services',
    contact_email: 'hello@premiersecurity.uk',
    user_id: 'user-provider-3',
  },
  {
    id: 'provider-4',
    company_name: 'New Supplier Ltd',
    contact_email: 'contact@newsupplier.com',
    user_id: 'user-provider-4',
    status: 'pending',
  },
];

// Initial assignments removed - will be loaded from Supabase
const initialAssignments: Assignment[] = [];

export const useMockDataStore = create<MockDataStore>((set, get) => ({
  // Initial state
  events: initialEvents,
  providers: initialProviders,
  assignments: initialAssignments,
  availability: [],
  staffDetails: [],
  staffTimes: [],
  messages: [],
  documents: [],
  invoices: [],
  eventTemplates: [],
  activityLogs: [],
  notifications: [],
  onboardingDocuments: [
    {
      id: 'onboard-1',
      provider_id: 'provider-1',
      document_type: 'contractor_agreement',
      title: 'KSS NW UK Contractor Agreement',
      content: 'This agreement outlines the terms and conditions for providing staffing services to KSS NW UK 2026 Festival Season...',
      required: true,
      completed: true,
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      signature: 'John Doe',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'onboard-2',
      provider_id: 'provider-1',
      document_type: 'nda',
      title: 'Non-Disclosure Agreement',
      content: 'NDA_TEMPLATE', // Will be replaced with actual template
      required: true,
      completed: true,
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      signature: 'John Doe',
      signed_name: 'John Doe',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'onboard-3',
      provider_id: 'provider-2',
      document_type: 'contractor_agreement',
      title: 'KSS NW UK Contractor Agreement',
      content: 'This agreement outlines the terms and conditions for providing staffing services to KSS NW UK 2026 Festival Season...',
      required: true,
      completed: false,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'onboard-4',
      provider_id: 'provider-2',
      document_type: 'nda',
      title: 'Non-Disclosure Agreement',
      content: 'NDA_TEMPLATE', // Will be replaced with actual template
      required: true,
      completed: false,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'onboard-5',
      provider_id: 'provider-4',
      document_type: 'contractor_agreement',
      title: 'KSS NW UK Contractor Agreement',
      content: 'CONTRACTOR_AGREEMENT_TEMPLATE', // Will be replaced with actual template
      required: true,
      completed: false,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'onboard-6',
      provider_id: 'provider-4',
      document_type: 'nda',
      title: 'Non-Disclosure Agreement',
      content: 'NDA_TEMPLATE', // Will be replaced with actual template
      required: true,
      completed: false,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  currentUser: null,
  isLoading: false,
  reminders: [],
  documentComments: [],

  // User actions
  setCurrentUser: (user) => set({ currentUser: user }),
  
  // Loading actions (no-op for mock data, data is already loaded)
  loadEvents: async () => {
    // Mock data is already loaded, just set loading to false
    set({ isLoading: false });
  },
  loadAssignments: async () => {
    set({ isLoading: false });
  },
  loadProviders: async () => {
    set({ isLoading: false });
  },
  loadInvoices: async () => {
    set({ isLoading: false });
  },

  // Event actions
  createEvent: (eventData) => {
    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => {
      const user = state.currentUser;
      if (user) {
        get().addActivityLog({
          user_id: user.id,
          action: 'created',
          entity_type: 'event',
          entity_id: newEvent.id,
          details: { name: newEvent.name, location: newEvent.location },
        });
      }
      return {
        events: [...state.events, newEvent],
      };
    });
    return newEvent;
  },

  updateEvent: async (id, updates) => {
    const state = get();
    const event = state.events.find((e) => e.id === id);
    if (!event) {
      throw new Error(`Event with id ${id} not found`);
    }
    
    const user = state.currentUser;
    if (user) {
      get().addActivityLog({
        user_id: user.id,
        action: 'updated',
        entity_type: 'event',
        entity_id: id,
        details: { changes: updates, previous_name: event.name },
      });
    }
    
    const updatedEvent: Event = {
      ...event,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    
    set((state) => ({
      events: state.events.map((e) => (e.id === id ? updatedEvent : e)),
    }));
    
    return updatedEvent;
  },

  deleteEvent: async (id) => {
    set((state) => {
      const user = state.currentUser;
      const event = state.events.find((e) => e.id === id);
      if (user && event) {
        get().addActivityLog({
          user_id: user.id,
          action: 'deleted',
          entity_type: 'event',
          entity_id: id,
          details: { name: event.name },
        });
      }
      return {
        events: state.events.filter((event) => event.id !== id),
        assignments: state.assignments.filter((assignment) => assignment.event_id !== id),
      };
    });
  },

  // Assignment actions
  createAssignment: (assignmentData) => {
    const newAssignment: Assignment = {
      ...assignmentData,
      id: `assignment-${Date.now()}`,
      status: assignmentData.status || 'pending',
      details_requested: assignmentData.details_requested ?? false,
      times_sent: assignmentData.times_sent ?? false,
      timesheets_confirmed: assignmentData.timesheets_confirmed ?? false,
    };
    set((state) => ({
      assignments: [...state.assignments, newAssignment],
    }));
    return newAssignment;
  },

  updateAssignment: async (id, updates) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === id ? { ...assignment, ...updates } : assignment
      ),
    }));
  },

  deleteAssignment: async (id) => {
    set((state) => ({
      assignments: state.assignments.filter((assignment) => assignment.id !== id),
    }));
  },

  acceptAssignment: async (id) => {
    set((state) => {
      const user = state.currentUser;
      const assignment = state.assignments.find((a) => a.id === id);
      if (user && assignment) {
        const event = state.events.find((e) => e.id === assignment.event_id);
        get().addActivityLog({
          user_id: user.id,
          action: 'accepted',
          entity_type: 'assignment',
          entity_id: id,
          details: { event_id: assignment.event_id, provider_id: assignment.provider_id },
        });
        // Notify admin
        get().addNotification({
          user_id: 'admin',
          type: 'assignment',
          title: 'Assignment Accepted',
          message: `${state.providers.find((p) => p.id === assignment.provider_id)?.company_name || 'Provider'} accepted assignment for ${event?.name || 'event'}`,
          link: `/admin/events/${assignment.event_id}`,
          read: false,
        });
      }
      return {
        assignments: state.assignments.map((assignment) =>
          assignment.id === id
            ? {
                ...assignment,
                status: 'accepted' as AssignmentStatus,
                accepted_at: new Date().toISOString(),
              }
            : assignment
        ),
      };
    });
  },

  declineAssignment: async (id) => {
    set((state) => ({
      assignments: state.assignments.map((assignment) =>
        assignment.id === id
          ? { ...assignment, status: 'declined' as AssignmentStatus }
          : assignment
      ),
    }));
  },

  confirmTimesheets: async (assignmentId, file) => {
    // Mock implementation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set((state) => ({
      assignments: state.assignments.map((a) =>
        a.id === assignmentId ? { ...a, timesheets_confirmed: true } : a
      ),
    }));
    
    // Add activity log
    get().addActivityLog({
      user_id: get().currentUser?.id || 'admin',
      action: 'timesheets_confirmed',
      entity_type: 'assignment',
      entity_id: assignmentId,
      details: { file_name: file.name },
    });
  },

  // Availability (mock)
  loadProviderAvailability: async (_providerId) => {
    // No-op in mock mode
    set({ isLoading: false });
  },
  loadEventAvailability: async (_eventId) => {
    set({ isLoading: false });
  },
  setProviderAvailability: (providerId, eventId, status) => {
    const now = new Date().toISOString();
    const newEntry: ProviderAvailability = {
      id: `avail-${providerId}-${eventId}`,
      provider_id: providerId,
      event_id: eventId,
      status,
      created_at: now,
      updated_at: now,
    };
    set((state) => {
      const other = state.availability.filter(
        (a) => !(a.provider_id === providerId && a.event_id === eventId)
      );
      return { availability: [...other, newEntry] };
    });
    // Log activity
    get().addActivityLog({
      user_id: 'provider',
      action: 'availability_update',
      entity_type: 'event',
      entity_id: eventId,
      details: { provider_id: providerId, status },
    });
    return newEntry;
  },
  getAvailabilityForEvent: (eventId) => get().availability.filter((a) => a.event_id === eventId),
  getAvailabilityForProvider: (providerId) =>
    get().availability.filter((a) => a.provider_id === providerId),

  // Staff details actions
  loadStaffDetails: async (assignmentId) => {
    // In mock mode, this is a no-op since we're not loading from a server
    // Staff details are stored in the state
  },
  addStaffDetail: (detailData) => {
    const newDetail: StaffDetail = {
      ...detailData,
      id: `staff-${Date.now()}`,
    };
    set((state) => ({
      staffDetails: [...state.staffDetails, newDetail],
    }));
    return newDetail;
  },

  getStaffDetailsByAssignment: (assignmentId) => {
    return get().staffDetails.filter((detail) => detail.assignment_id === assignmentId);
  },

  // Staff Times actions
  loadStaffTimes: async (assignmentId) => {
    // In mock mode, this is a no-op since we're not loading from a server
    // Staff times are stored in the state
  },
  createStaffTimes: async (staffTimes) => {
    const newStaffTimes: StaffTimes = {
      ...staffTimes,
      id: `staff-times-${Date.now()}-${Math.random()}`,
      role_type: staffTimes.role_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sent_at: staffTimes.sent_at || new Date().toISOString(),
    };
    set((state) => ({
      staffTimes: [...state.staffTimes, newStaffTimes],
    }));
    return newStaffTimes;
  },
  deleteStaffTimesByAssignment: async (assignmentId) => {
    set((state) => ({
      staffTimes: state.staffTimes.filter((s) => s.assignment_id !== assignmentId),
    }));
  },
  getStaffTimesByAssignment: (assignmentId) => {
    return get().staffTimes
      .filter((s) => s.assignment_id === assignmentId)
      .sort((a, b) => a.shift_number - b.shift_number);
  },

  // Message actions
  sendMessage: (messageData) => {
    const newMessage: Message = {
      ...messageData,
      id: `message-${Date.now()}`,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      read: false,
    };
    set((state) => {
      // Create notification for receiver
      const receiver = state.providers.find((p) => p.user_id === messageData.receiver_id) ||
        (messageData.receiver_id === 'admin' ? { id: 'admin', company_name: 'Admin' } : null);
      if (receiver) {
        get().addNotification({
          user_id: messageData.receiver_id,
          type: 'message',
          title: 'New Message',
          message: `You have a new message from ${state.currentUser?.email || 'Admin'}`,
          link: `/admin/messages`,
          read: false,
        });
      }
      return {
        messages: [...state.messages, newMessage],
      };
    });
    return newMessage;
  },

  getMessages: (userId1, userId2) => {
    return get().messages.filter(
      (msg) =>
        (msg.sender_id === userId1 && msg.receiver_id === userId2) ||
        (msg.sender_id === userId2 && msg.receiver_id === userId1)
    );
  },

  // Document actions
  uploadDocument: (documentData) => {
    const newDocument: Document = {
      ...documentData,
      id: `doc-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      documents: [...state.documents, newDocument],
    }));
    return newDocument;
  },

  loadDocuments: async (eventId, providerId) => {
    // Mock data is already loaded, just set loading to false
    set({ isLoading: false });
  },

  getDocumentsByEvent: (eventId, providerId) => {
    return get().documents.filter(
      (doc) =>
        doc.event_id === eventId &&
        (doc.provider_id === null || doc.provider_id === undefined || doc.provider_id === providerId)
    );
  },

  addDocumentComment: (commentData) => {
    const newComment: DocumentComment = {
      ...commentData,
      id: `comment-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      documentComments: [...state.documentComments, newComment],
    }));
    return newComment;
  },

  getDocumentComments: (documentId) => {
    return get().documentComments.filter((c) => c.document_id === documentId);
  },

  // Invoice actions
  uploadInvoice: (invoiceData, adminEmail?) => {
    // adminEmail is ignored in mock mode - no RLS to bypass
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `invoice-${Date.now()}`,
      status: invoiceData.status || 'pending',
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      invoices: [...state.invoices, newInvoice],
    }));
    return newInvoice;
  },

  updateInvoiceStatus: async (id, status, paymentDate) => {
    set((state) => ({
      invoices: state.invoices.map((invoice) =>
        invoice.id === id
          ? {
              ...invoice,
              status,
              payment_date: paymentDate || invoice.payment_date,
            }
          : invoice
      ),
    }));
  },

  getInvoicesByProvider: (providerId) => {
    return get().invoices.filter((invoice) => invoice.provider_id === providerId);
  },

  getInvoicesByEvent: (eventId) => {
    return get().invoices.filter((invoice) => invoice.event_id === eventId);
  },

  // Event Template actions
  createEventTemplate: (templateData) => {
    const newTemplate: EventTemplate = {
      ...templateData,
      id: `template-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      eventTemplates: [...state.eventTemplates, newTemplate],
    }));
    return newTemplate;
  },

  updateEventTemplate: (id, updates) => {
    set((state) => ({
      eventTemplates: state.eventTemplates.map((template) =>
        template.id === id
          ? { ...template, ...updates, updated_at: new Date().toISOString() }
          : template
      ),
    }));
  },

  deleteEventTemplate: (id) => {
    set((state) => ({
      eventTemplates: state.eventTemplates.filter((template) => template.id !== id),
    }));
  },

  createEventFromTemplate: (templateId, date, name) => {
    const template = get().eventTemplates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }
      return get().createEvent({
        name: name || template.name,
        location: template.location || '',
        date,
        requirements: template.requirements,
      });
    },

  // Activity Log actions
  loadActivityLogs: async () => {
    // In mock mode, activity logs are already in state, so just resolve
    // This matches the Supabase store interface
    return Promise.resolve();
  },

  addActivityLog: (logData) => {
    const newLog: ActivityLog = {
      ...logData,
      id: `log-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      activityLogs: [newLog, ...state.activityLogs].slice(0, 1000), // Keep last 1000 logs
    }));
    return newLog;
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
  addNotification: (notificationData) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notif-${Date.now()}`,
      read: false,
      created_at: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
    return newNotification;
  },

  getNotifications: (userId) => {
    return get()
      .notifications.filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  },

  markAllNotificationsRead: (userId) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.user_id === userId && !n.read ? { ...n, read: true } : n
      ),
    }));
  },

  getUnreadNotificationCount: (userId) => {
    return get().notifications.filter((n) => n.user_id === userId && !n.read).length;
  },

  // Onboarding actions
  loadOnboardingDocuments: async (providerId) => {
    set({ isLoading: false });
  },
  loadAllOnboardingDocuments: async () => {
    set({ isLoading: false });
  },
  getOnboardingDocuments: (providerId) => {
    return get()
      .onboardingDocuments.filter((doc) => doc.provider_id === providerId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  createOnboardingDocument: (docData) => {
    // If content is the template placeholder, it will be generated dynamically when displayed
    const newDoc: OnboardingDocument = {
      ...docData,
      id: `onboard-${Date.now()}`,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    set((state) => ({
      onboardingDocuments: [...state.onboardingDocuments, newDoc],
    }));
    return newDoc;
  },

  completeOnboardingDocument: (id, signature, signedName) => {
    set((state) => {
      const updatedDocs = state.onboardingDocuments.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              completed: true,
              completed_at: new Date().toISOString(),
              signature: signature || doc.signature,
              signed_name: signedName || doc.signed_name,
              updated_at: new Date().toISOString(),
            }
          : doc
      );

      // Check if all required documents are completed for this provider
      const doc = updatedDocs.find((d) => d.id === id);
      if (doc) {
        const providerDocs = updatedDocs.filter((d) => d.provider_id === doc.provider_id && d.required);
        const allCompleted = providerDocs.every((d) => d.completed);

        if (allCompleted) {
          // Update provider status to pending and set submitted_at
          const provider = state.providers.find((p) => p.id === doc.provider_id);
          if (provider && !provider.submitted_at) {
            // Update provider status
            get().updateProviderDetails(provider.id, {
              status: 'pending',
              submitted_at: new Date().toISOString(),
            });
            // Create notification for admin
            get().addNotification({
              user_id: 'admin',
              type: 'system',
              title: 'New Supplier Onboarding Complete',
              message: `${provider.company_name} has completed onboarding and is pending approval`,
              link: `/admin/providers/pending`,
          read: false,
            });
          }
        }
      }

      return {
        onboardingDocuments: updatedDocs,
      };
    });
  },

  isProviderOnboarded: (providerId) => {
    const provider = get().providers.find((p) => p.id === providerId);
    if (!provider) return false;
    // Provider is onboarded if they have status 'approved'
    return provider.status === 'approved';
  },

  updateProviderDetails: async (id, details) => {
    set((state) => ({
      providers: state.providers.map((provider) =>
        provider.id === id
          ? {
              ...provider,
              ...details,
              updated_at: new Date().toISOString(),
            }
          : provider
      ),
    }));
  },

  approveProvider: async (id) => {
    set((state) => {
      const provider = state.providers.find((p) => p.id === id);
      if (provider) {
        // Create notification for provider
        get().addNotification({
          user_id: provider.user_id,
          type: 'system',
          title: 'Account Approved',
          message: 'Your account has been approved. You now have full access to the system.',
          link: '/provider/dashboard',
          read: false,
        });
        get().addActivityLog({
          user_id: 'admin',
          action: 'provider_approved',
          entity_type: 'provider',
          entity_id: id,
          details: { provider_id: id },
        });
      }
      return {
        providers: state.providers.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'approved' as const,
                approved_at: new Date().toISOString(),
              }
            : p
        ),
      };
    });
  },

  rejectProvider: async (id, reason) => {
    set((state) => {
      const provider = state.providers.find((p) => p.id === id);
      if (provider) {
        // Create notification for provider
        get().addNotification({
          user_id: provider.user_id,
          type: 'system',
          title: 'Account Rejected',
          message: reason || 'Your account application has been rejected.',
          read: false,
        });
        get().addActivityLog({
          user_id: 'admin',
          action: 'provider_rejected',
          entity_type: 'provider',
          entity_id: id,
          details: { provider_id: id, reason },
        });
      }
      return {
        providers: state.providers.map((p) =>
          p.id === id
            ? {
                ...p,
                status: 'rejected' as const,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason,
              }
            : p
        ),
      };
    });
  },

  getPendingProviders: () => {
    return get().providers.filter((p) => p.status === 'pending');
  },
}));

