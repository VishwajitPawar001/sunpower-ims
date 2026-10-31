import { ProjectLead, SiteSurveyInput } from '@/types/solar';

export interface ApiErrorPayload {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]> | null;
  timestamp?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
}

export class ApiError extends Error {
  code: string;
  status: number;
  fieldErrors?: Record<string, string[]> | null;

  constructor(status: number, error: ApiErrorPayload) {
    super(error.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = error.code || `HTTP_${status}`;
    this.fieldErrors = error.fieldErrors;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sunpower_auth_token') : null;

  const res = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const payload: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    error: {
      code: 'NETWORK_PARSE_ERROR',
      message: 'Failed to communicate with API server or parse response payload.',
    },
  }));

  if (!res.ok || !payload.success) {
    throw new ApiError(res.status, payload.error ?? { code: `HTTP_${res.status}`, message: res.statusText });
  }

  return payload.data as T;
}

// 1. Authentication
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name?: string;
    fullName?: string;
    role: 'ADMIN' | 'DIRECTOR' | 'SALES' | 'SURVEYOR' | 'WAREHOUSE' | 'TECHNICIAN' | 'SUPPORT';
  };
}

export async function loginApi(credentials: { email: string; password: string }): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

// 2. Sales CRM & Quotes
export async function getLeadsApi(): Promise<ProjectLead[]> {
  return request<ProjectLead[]>('/api/leads', { method: 'GET' });
}

export async function createLeadApi(data: {
  customerName: string;
  phone: string;
  address: string;
  capacityKw: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  email?: string;
}): Promise<ProjectLead> {
  return request<ProjectLead>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function generateQuoteApi(data: {
  projectId: string;
  capacityKw?: number;
  systemType?: 'ON_GRID' | 'OFF_GRID';
  agreedPrice?: number;
  marginMarkupPercent?: number;
}): Promise<{ quoteId: string; projectStatus: string; project?: unknown; quote?: unknown }> {
  return request('/api/quotes/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function confirmOrderApi(data: {
  projectId: string;
  agreedPrice: number;
}): Promise<{ message: string; project: unknown }> {
  return request('/api/orders/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 3. Surveyor Feasibility
export type SiteSurveyPayload = SiteSurveyInput;

export async function submitSurveyApi(data: SiteSurveyInput): Promise<{ surveyId: string; projectStatus: string; project?: unknown }> {
  return request('/api/surveys', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 4. Warehouse Dispatch Barcode Scan (POST /api/dispatch/scan & GET /api/dispatch)
export interface DispatchScanResult {
  serialNumber: string;
  category: string;
  modelName: string;
  dispatchedAt: string;
  projectStatus: string;
}

export async function scanDispatchBarcodeApi(data: {
  projectId: string;
  serialNumber: string;
}): Promise<DispatchScanResult> {
  return request<DispatchScanResult>('/api/dispatch/scan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getWarehouseStockApi(projectId?: string): Promise<{
  stockItems: Array<{
    id: string;
    sku: string;
    modelName: string;
    category: string;
    unitCost: number;
    quantityOnHand: number;
    warrantyMonths: number;
    serialRegistry?: Array<{ id: string; serialNumber: string; isDispatched: boolean; projectId: string | null }>;
  }>;
  availableSerials: Array<{
    id: string;
    serialNumber: string;
    stockItem: { sku: string; modelName: string; category: string };
  }>;
}> {
  const url = projectId ? `/api/dispatch?projectId=${encodeURIComponent(projectId)}` : '/api/dispatch';
  return request(url, { method: 'GET' });
}

// 5. Technician Commissioning Sign-Off (POST /api/commissioning/sign)
export interface CommissioningSignPayload {
  projectId: string;
  vocVolts?: number;
  vocVoltsMeasured?: number;
  iscAmperes?: number;
  iscAmpsMeasured?: number;
  earthingResistanceOhms: number;
  signatureSvg?: string;
  customerSignatureSvg?: string;
  completionPhotoUrl?: string;
}

export async function submitCommissioningSignApi(
  data: CommissioningSignPayload
): Promise<{ recordId: string; projectStatus: string; warrantyStartDate: string }> {
  return request('/api/commissioning/sign', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 6. Executive Margins (GET /api/analytics/margins)
export interface AnalyticsMarginsData {
  totalRevenue: number;
  totalEstimatedBOMCost: number;
  totalLaborCost: number;
  totalOverheadCost: number;
  grossMarginPercent: number;
  pipelineDistribution: {
    leadReceived: number;
    surveyPending: number;
    surveyApproved: number;
    quoteIssued: number;
    orderConfirmed: number;
    dispatched: number;
    commissioned: number;
    completed: number;
    rejected: number;
  };
  projects: Array<{
    code: string;
    customer: string;
    capacity: string;
    invoice: number;
    bom: number;
    labor: number;
    overhead: number;
    profit: number;
    marginPct: number;
    status: string;
  }>;
}

export async function fetchAnalyticsMarginsApi(): Promise<AnalyticsMarginsData> {
  return request<AnalyticsMarginsData>('/api/analytics/margins', {
    method: 'GET',
  });
}

// 7. Support Tickets (GET /api/tickets & PATCH /api/tickets/[id])
export interface SupportTicket {
  id: string;
  ticketCode: string;
  projectId: string;
  projectCode: string;
  customerName: string;
  issueDescription: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'INVESTIGATING' | 'PARTS_REPLACED' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}

interface TicketsResponse {
  count?: number;
  tickets?: SupportTicket[];
}

export async function getTicketsApi(): Promise<SupportTicket[]> {
  const res = await request<SupportTicket[] | TicketsResponse>('/api/tickets', { method: 'GET' });
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.tickets)) return res.tickets;
  return [];
}

export async function updateTicketStatusApi(
  ticketId: string,
  status: string,
  description?: string,
  replacementSerial?: string
): Promise<unknown> {
  return request(`/api/tickets/${ticketId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, description, replacementSerial }),
  });
}

export async function createTicketApi(data: {
  projectId?: string;
  serialNumber?: string;
  reportedFaultCode?: string;
  description: string;
  priority?: string;
}): Promise<SupportTicket> {
  return request<SupportTicket>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
