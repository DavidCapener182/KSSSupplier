export type AssignmentStatus = 'pending' | 'accepted' | 'declined';

export interface Event {
  id: string;
  name: string;
  location: string;
  date: string;
  end_date?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
  requirements: {
    managers: number;
    supervisors: number;
    sia: number;
    stewards: number;
  };
  daily_requirements?: {
    date: string;
    requirements: {
      managers: number;
      supervisors: number;
      sia: number;
      stewards: number;
    };
  }[];
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: string;
  company_name: string;
  contact_email: string;
  user_id: string;
  address?: string;
  company_registration?: string;
  contact_phone?: string;
  director_contact_name?: string;
  notes?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  submitted_at?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

export interface Assignment {
  id: string;
  event_id: string;
  provider_id: string;
  assigned_managers: number;
  assigned_supervisors: number;
  assigned_sia: number;
  assigned_stewards: number;
  status: AssignmentStatus;
  accepted_at?: string;
  declined_at?: string;
  created_at?: string;
  updated_at?: string;
  details_requested: boolean;
  times_sent: boolean;
  timesheets_confirmed: boolean;
  actual_managers?: number | null;
  actual_supervisors?: number | null;
  actual_sia?: number | null;
  actual_stewards?: number | null;
}

export interface StaffDetail {
  id: string;
  assignment_id: string;
  staff_name: string;
  role?: 'Manager' | 'Supervisor' | 'SIA' | 'Steward';
  sia_number?: string;
  sia_expiry_date?: string; // Date in YYYY-MM-DD format
  pnc_info?: string;
  created_at?: string;
}

export interface StaffTimes {
  id: string;
  assignment_id: string;
  role_type: 'managers' | 'supervisors' | 'sia' | 'stewards';
  staff_count: number;
  start_time: string; // 24hr format (e.g., '09:00:00')
  end_time: string; // 24hr format (e.g., '17:00:00')
  shift_number: number; // Order of shifts (1, 2, 3, etc.)
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  created_at: string;
  read?: boolean;
  attachment_path?: string;
  attachment_name?: string;
  attachment_type?: string;
}

export interface Document {
  id: string;
  event_id: string;
  provider_id: string | null;
  file_path: string;
  file_name: string;
  file_type: string;
  created_at: string;
  comments?: DocumentComment[];
}

export interface DocumentComment {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  event_id: string;
  provider_id: string;
  file_path: string | null; // Can be null for purchase orders
  amount: number | null;
  status: 'pending' | 'approved' | 'paid' | 'purchase_order' | 'outstanding';
  created_at: string;
  payment_date?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'provider';
  forcePasswordChange?: boolean;
}

export interface EventTemplate {
  id: string;
  name: string;
  location?: string;
  requirements: {
    managers: number;
    supervisors: number;
    sia: number;
    stewards: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: 'event' | 'assignment' | 'invoice' | 'document' | 'message' | 'provider' | 'onboarding_document';
  entity_id: string;
  details: Record<string, any>;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'assignment' | 'message' | 'invoice' | 'reminder' | 'system' | 'double_booking';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
}

export interface OnboardingDocument {
  id: string;
  provider_id: string;
  document_type: 'contractor_agreement' | 'nda';
  title: string;
  content: string;
  file_path?: string;
  required: boolean;
  completed: boolean;
  completed_at?: string;
  signature?: string;
  signed_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ProviderAvailability {
  id: string;
  event_id: string;
  provider_id: string;
  status: 'available' | 'unavailable';
  created_at: string;
  updated_at: string;
}

export interface DoubleBookingAlert {
  id: string;
  event_id: string;
  staff_detail_id_1: string;
  staff_detail_id_2: string;
  sia_number?: string;
  staff_name?: string;
  match_type: 'sia_number' | 'name_fuzzy';
  similarity_score: number;
  status: 'pending' | 'resolved' | 'ignored';
  created_at: string;
  updated_at: string;
  
  // Joined fields
  event?: Event;
  provider1_name?: string;
  provider2_name?: string;
}

export interface EventCheckIn {
  id: string;
  event_id: string;
  staff_detail_id?: string;
  sia_number: string;
  staff_name: string;
  provider_id?: string;
  check_in_time: string;
  check_in_method: 'qr_scan' | 'manual_entry';
  verified: boolean;
  is_duplicate: boolean;
  created_at: string;
}

export type ScanResult = {
  success: boolean;
  status: 'verified' | 'unlisted' | 'duplicate' | 'error';
  staffName?: string;
  providerName?: string;
  timestamp: string;
  message: string;
};
