// ========================================
// REGION
// ========================================
export interface Region {
  id: string;
  region_name: string;
  region_code: number;
}

// ========================================
// TICKET
// ========================================
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
  wrong_input_username?: string;
  description: string;
  fix_description?: string;
  status: TicketStatus;
  priority: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;

  // New columns
  origin_region_id?: string;
  target_team?: string;
  stage?: string;
  triaged_by?: string;
  triaged_at?: string;
  current_queue: string;
  redirected_by?: string;
  redirected_at?: string;

  // Relations
  branch?: Branch;
  feature?: Feature;
  reporter?: Profile;
  origin_region?: Region;
  attachments?: Attachment[];
  detail_lines?: DetailLine[];
  status_history?: StatusHistory[];
}

export enum TicketStatus {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  RESOLVED = "done",
  REJECTED = "rejected",
  PENDING = "pending", // Deprecated, mapped to OPEN in UI
}

// ========================================
// BRANCH
// ========================================
export interface Branch {
  id: string;
  name: string;
  is_active: boolean;
  region_id?: string;
  created_at: string;
  region?: Region;
}

// ========================================
// FEATURE
// ========================================
export interface Feature {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

// ========================================
// PROFILE / USER
// ========================================
export interface Profile {
  id: string;
  full_name: string;
  display_name?: string;
  email?: string;
  role: UserRole;
  branch_id?: string;
  region_id?: string;
  created_at: string;
  branch?: Branch;
  region?: Region;
}

export enum UserRole {
  ADMIN = "admin",
  ACCOUNTING_HO = "ACCOUNTING_HO",
  OUTLET = "OUTLET",
  FIN_ADMIN = "FIN_ADMIN",
  IT_SABANG = "IT_SABANG",
  FINANCE_HO = "FINANCE_HO",
}

// ========================================
// TICKET SUB-ENTITIES
// ========================================
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

// ========================================
// HELPER: Human-readable role labels
// ========================================
export const ROLE_LABELS: Record<string, string> = {
  [UserRole.ADMIN]: "Super Admin",
  [UserRole.ACCOUNTING_HO]: "Accounting HO",
  [UserRole.OUTLET]: "Outlet",
  [UserRole.FIN_ADMIN]: "Finance Admin",
  [UserRole.IT_SABANG]: "IT Sabang",
  [UserRole.FINANCE_HO]: "Finance HO",
};
