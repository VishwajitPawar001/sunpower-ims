export type UserRole = 'SALES' | 'SURVEYOR' | 'WAREHOUSE' | 'TECHNICIAN' | 'DIRECTOR';

export type ProjectStatus =
  | 'LEAD_RECEIVED'
  | 'SURVEY_PENDING'
  | 'SURVEY_APPROVED'
  | 'REJECTED'
  | 'QUOTE_ISSUED'
  | 'ORDER_CONFIRMED'
  | 'DISPATCHED'
  | 'COMMISSIONED'
  | 'COMPLETED';

export type SystemType = 'ON_GRID' | 'OFF_GRID';

export interface ProjectLead {
  id: string;
  projectCode: string;
  customerName: string;
  phone: string;
  address: string;
  capacityKw: number;
  systemType: SystemType;
  status: ProjectStatus;
  agreedPrice: number;
  createdAt: string;
}

export interface SiteSurveyInput {
  projectId: string;
  usableAreaSqm: number;
  tiltDegrees: number;
  azimuthDegrees: number;
  cableRunMeters: number;
  sanctionedLoadKw: number;
  isShadowFree: boolean;
  isViable: boolean;
  notes?: string;
}

export interface SerialVerificationItem {
  sku: string;
  category: 'INVERTER' | 'BATTERY' | 'PANEL' | 'STRUCTURE' | 'BOS';
  modelName: string;
  requiredQty: number;
  scannedSerials: string[];
}