import {
  Project,
  SiteSurvey,
  SupportTicket,
  User,
  ProjectFinancialItem,
  MonthEndExecutiveSummary,
  SerialRegistry,
} from "@/types/solar";

// ----------------------------------------------------
// API RESPONSE INTERFACE
// ----------------------------------------------------

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

// ----------------------------------------------------
// API ERROR CLASS
// ----------------------------------------------------

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ----------------------------------------------------
// COMMON API REQUEST FUNCTION
// ----------------------------------------------------

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let json: ApiResponse<T>;

  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "Invalid server response"
    );
  }

  if (!response.ok || !json.success) {
    const errorMsg =
      json.error?.message ||
      `Request failed with status ${response.status}`;

    throw new ApiError(response.status, errorMsg);
  }

  return json.data;
}

// ----------------------------------------------------
// AUTHENTICATION
// ----------------------------------------------------

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginUser(
  payload: LoginPayload
): Promise<User> {
  return request<User>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.trim(),
      password: payload.password,
    }),
  });
}

export const loginApi = loginUser;

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
  projectCode: string;
  capacityKw: number;
  systemType: "ON_GRID" | "OFF_GRID" | "HYBRID";
  agreedPrice?: number;
}

export async function createLead(
  payload: CreateLeadPayload
): Promise<Project> {
  return request<Project>("/api/leads", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchSurveys(
  projectId?: number
): Promise<SiteSurvey[]> {
  const url = projectId
    ? `/api/surveys?projectId=${projectId}`
    : "/api/surveys";

  return request<SiteSurvey[]>(url);
}

export interface SubmitSurveyPayload {
  projectId: number;
  surveyorId: number;
  roofType: "FLAT_RCC" | "METAL_SHEET" | "TILED" | "GROUND_MOUNT";
  roofUsableAreaSqm: number;
  tiltDegrees: number;
  azimuthDegrees: number;
  cableRunMeters: number;
  sanctionedLoadKw: number;
  isShadowFree: boolean;
  isViable: boolean;
  notes?: string;
}

export async function submitSurvey(
  payload: SubmitSurveyPayload
): Promise<SiteSurvey> {
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

export async function generateQuote(
  payload: GenerateQuotePayload
) {
  return request<{
    project: Project;
    quotationBreakdown: Record<string, unknown>;
  }>("/api/quotes/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface RecordPaymentPayload {
  projectId: number;
  paymentAmount: number;
  milestoneType: "BOOKING_20" | "PRE_DISPATCH_70";
}

export async function recordMilestonePayment(
  payload: RecordPaymentPayload
) {
  return request<{
    message: string;
    project: Project;
  }>("/api/orders/confirm", {
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

export async function dispatchProjectKit(
  projectId: number,
  serialNumbers: string[]
) {
  return request<{
    message: string;
    project: Project;
    dispatchedSerials: SerialRegistry[];
  }>("/api/dispatch", {
    method: "POST",
    body: JSON.stringify({
      projectId,
      serialNumbers,
    }),
  });
}

// ----------------------------------------------------
// PHASE 5 & 6: FIELD COMMISSIONING & HANDOVER
// ----------------------------------------------------

export interface SubmitCommissioningPayload {
  projectId: number;
  leadTechnicianId: number;
  vocVoltsMeasured: number;
  iscAmpsMeasured: number;
  earthingResistanceOhms: number;
  completionPhotoUrl: string;
  customerSignatureSvg: string;
}

export async function submitCommissioning(
  payload: SubmitCommissioningPayload
) {
  return request<{
    message: string;
    project: Project;
  }>("/api/commissioning/sign", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ----------------------------------------------------
// PHASE 8: SUPPORT TICKETS & RMA SWAPS
// ----------------------------------------------------

export async function fetchTickets(
  status?: string,
  search?: string
): Promise<SupportTicket[]> {
  const params = new URLSearchParams();

  if (status) params.append("status", status);
  if (search) params.append("search", search);

  const query = params.toString();

  return request<SupportTicket[]>(
    query ? `/api/tickets?${query}` : "/api/tickets"
  );
}

export interface CreateTicketPayload {
  ticketNumber: string;
  projectId: number;
  serialRegistryId?: number;
  reportedFaultCode: string;
  description: string;
  isCoveredUnderWarranty: boolean;
  billableAmount?: number;
}

export async function createTicket(
  payload: CreateTicketPayload
): Promise<SupportTicket> {
  return request<SupportTicket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface UpdateTicketPayload {
  status?: string;
  reportedFaultCode?: string;
  description?: string;
  isCoveredUnderWarranty?: boolean;
  billableAmount?: number;
  serialRegistryId?: number | null;
}

export async function updateTicket(
  ticketId: number,
  payload: UpdateTicketPayload
): Promise<SupportTicket> {
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
  return request<DirectorAnalyticsResponse>(
    "/api/analytics/margins"
  );
}