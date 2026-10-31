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
  fieldErrors?: Record<string, string[]> | null;

  constructor(error: ApiErrorPayload) {
    super(error.message);
    this.name = 'ApiError';
    this.code = error.code || 'API_ERROR';
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
    throw new ApiError(payload.error ?? { code: `HTTP_${res.status}`, message: res.statusText });
  }

  return payload.data as T;
}

// 1. Sales Leads & Quotes
export async function getLeadsApi(): Promise<ProjectLead[]> {
  return request<ProjectLead[]>('/api/leads', { method: 'GET' });
}

export async function createLeadApi(data: {
  customerName: string;
  phone: string;
  address: string;
  capacityKw: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
}): Promise<ProjectLead> {
  return request<ProjectLead>('/api/leads', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface QuoteGeneratePayload {
  projectId: string;
  capacityKw: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  agreedPrice: number;
}

export async function generateQuoteApi(data: QuoteGeneratePayload): Promise<{ quoteId: string; projectStatus: string }> {
  return request('/api/quotes/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 2. Surveyor Feasibility
export type SiteSurveyPayload = SiteSurveyInput;

export async function submitSurveyApi(data: SiteSurveyInput): Promise<{ surveyId: string; projectStatus: string }> {
  return request('/api/surveys', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 3. Warehouse Dispatch
export interface DispatchScanPayload {
  projectId: string;
  serialNumbers: string[];
}

export async function submitDispatchScanApi(data: DispatchScanPayload): Promise<{ dispatchedCount: number; projectStatus: string }> {
  return request('/api/dispatch', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Alias to maintain compatibility across component implementations
export const commitDispatchScanApi = submitDispatchScanApi;

// 4. Technician Signoff
export interface CommissioningSignPayload {
  projectId: string;
  vocVoltsMeasured: number;
  iscAmpsMeasured: number;
  earthingResistanceOhms: number;
  completionPhotoUrl: string;
  customerSignatureSvg: string;
}

export async function submitCommissioningSignApi(data: CommissioningSignPayload): Promise<{ recordId: string; projectStatus: string }> {
  return request('/api/commissioning/sign', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// 5. Director Margins
export interface ProjectMarginRecord {
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
}

export interface FinanceMarginsData {
  totalRevenue: number;
  totalBomCost: number;
  laborCost: number;
  overheadCost: number;
  grossProfit: number;
  grossMarginPercent: number;
  activeProjectsCount: number;
  openWarrantyTickets: number;
  projects: ProjectMarginRecord[];
}

export async function fetchFinanceMarginsApi(): Promise<FinanceMarginsData> {
  return request<FinanceMarginsData>('/api/finance/margins', {
    method: 'GET',
  });
}