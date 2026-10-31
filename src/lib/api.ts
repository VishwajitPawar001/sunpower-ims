import {
  Project,
  SiteSurvey,
  SupportTicket,
  User,
  ProjectFinancialItem,
  MonthEndExecutiveSummary,
  SerialRegistry,
} from "@/types/solar";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.error?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json.data;
}

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------

export async function loginUser(email: string, password: string): Promise<User> {
  return request<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ----------------------------------------------------
// PHASE 1: LEADS & SURVEYS
// ----------------------------------------------------

export async function fetchLeads(): Promise<Project[]> {
  return request<Project[]>("/api/leads");
}

export interface CreateLeadPayload {
  fullName: string;
  phone: string;
  email?: string;
  installationAddress: string;
  city?: string;
  state?: string;
  pincode?: string;
  systemCapacityKw: number;
  systemType?: string;
  consumerAccountNumber?: string;
  sanctionedLoadKw?: number;
  monthlyPowerBill?: number;
  packageTemplateId?: number;
}

export async function createLead(payload: CreateLeadPayload): Promise<Project> {
  return request<Project>("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchSurveys(projectId?: number): Promise<SiteSurvey[]> {
  const url = projectId ? `/api/surveys?projectId=${projectId}` : "/api/surveys";
  return request<SiteSurvey[]>(url);
}

export interface SubmitSurveyPayload {
  projectId: number;
  roofType: string;
  usableAreaSqFt: number;
  isSouthFacing: boolean;
  tiltAngleDeg: number;
  hasShadingIssue: boolean;
  parapetHeightFt?: number;
  dcCableRunMtrs: number;
  acCableRunMtrs: number;
  earthPitViable: boolean;
  isApproved: boolean;
  rejectionReason?: string;
  surveyNotes?: string;
}

export async function submitSurvey(payload: SubmitSurveyPayload): Promise<SiteSurvey> {
  return request<SiteSurvey>("/api/surveys", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// PHASE 2: QUOTATIONS & MILESTONE PAYMENTS
// ----------------------------------------------------

export interface GenerateQuotePayload {
  projectId: number;
  packageTemplateId: number;
  customQuotedPrice?: number;
}

export async function generateQuote(payload: GenerateQuotePayload) {
  return request<{ project: Project; quotationBreakdown: Record<string, unknown> }>(
    "/api/quotes/generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export interface RecordPaymentPayload {
  projectId: number;
  paymentAmount: number;
  milestoneType: "BOOKING_20" | "PRE_DISPATCH_70";
}

export async function recordMilestonePayment(payload: RecordPaymentPayload) {
  return request<{ message: string; project: Project }>("/api/orders/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// PHASE 4: WAREHOUSE & KITTED DISPATCH
// ----------------------------------------------------

export async function fetchDispatchData(): Promise<{
  pendingProjects: Project[];
  availableSerials: SerialRegistry[];
}> {
  return request<{
    pendingProjects: Project[];
    availableSerials: SerialRegistry[];
  }>("/api/dispatch");
}

export async function dispatchProjectKit(projectId: number, serialNumbers: string[]) {
  return request<{
    message: string;
    project: Project;
    dispatchedSerials: SerialRegistry[];
  }>("/api/dispatch", {
    method: "POST",
    body: JSON.stringify({ projectId, serialNumbers }),
  });
}

// ----------------------------------------------------
// PHASE 5 & 6: FIELD COMMISSIONING & HANDOVER
// ----------------------------------------------------

export interface SubmitCommissioningPayload {
  projectId: number;
  civilPadsCompleted: boolean;
  groutCuringVerified: boolean;
  structureTorqued: boolean;
  dcConduitCompleted: boolean;
  earthPitsCompleted: boolean;
  vocVolts: number;
  iscAmperes: number;
  earthResistanceOhms: number;
  customerSignatureSvg: string;
  roofPhotoUrl?: string;
}

export async function submitCommissioning(payload: SubmitCommissioningPayload) {
  return request<{ message: string; project: Project }>("/api/commissioning/sign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// PHASE 8: SUPPORT TICKETS & RMA SWAPS
// ----------------------------------------------------

export async function fetchTickets(status?: string, search?: string): Promise<SupportTicket[]> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const query = params.toString();
  return request<SupportTicket[]>(query ? `/api/tickets?${query}` : "/api/tickets");
}

export interface CreateTicketPayload {
  projectId: number;
  reportedIssue: string;
  faultySerialNumber?: string;
  assignedToId?: number;
}

export async function createTicket(payload: CreateTicketPayload): Promise<SupportTicket> {
  return request<SupportTicket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UpdateTicketPayload {
  status?: string;
  assignedToId?: number | null;
  resolutionNotes?: string;
  faultySerialNumber?: string;
  replacementSerialNumber?: string;
}

export async function updateTicket(ticketId: number, payload: UpdateTicketPayload): Promise<SupportTicket> {
  return request<SupportTicket>(`/api/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// DIRECTOR EXECUTIVE FINANCIALS
// ----------------------------------------------------

export interface DirectorAnalyticsResponse {
  monthEndExecutiveSummary: MonthEndExecutiveSummary;
  projectFinancials: ProjectFinancialItem[];
}

export async function fetchDirectorMargins(): Promise<DirectorAnalyticsResponse> {
  return request<DirectorAnalyticsResponse>("/api/analytics/margins");
}