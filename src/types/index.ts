export interface Ticket {
  id: string;
  reporter_user_id?: string;
  reporter_name?: string;
  wrong_input_date: string;
  issue_type: string;
  branch_id: string;
  feature_id?: string;
  feature_other?: string;
  inputter_name?: string;
  description: string;
  fix_description?: string;
  status: TicketStatus;
  priority: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;

  // Relations
  branch?: Branch;
  feature?: Feature;
  reporter?: Profile;
  assignee?: Profile;
  attachments?: Attachment[];
  detail_lines?: DetailLine[];
  status_history?: StatusHistory[];
}

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  REJECTED = "rejected",
  PENDING = "PENDING",
}

export interface Branch {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Feature {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  display_name?: string; // Added per user request
  email?: string; // Added for display fallback
  role: UserRole;
  branch_id?: string;
  created_at: string;
  branch?: Branch;
}

export enum UserRole {
  REQUESTER = "requester",
  ADMIN = "admin",
}

export interface Attachment {
  id: string;
  ticket_id: string;
  file_path: string;
  file_name?: string;
  mime_type?: string;
  created_at: string;
}

export interface DetailLine {
  id: string;
  ticket_id: string;
  side: "wrong" | "expected";
  item_name: string;
  value?: string;
  note?: string;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  ticket_id: string;
  from_status?: TicketStatus;
  to_status: TicketStatus;
  changed_by?: string;
  created_at: string;
}

export interface User {
  id: string;
  email?: string;
  profile?: Profile;
}
