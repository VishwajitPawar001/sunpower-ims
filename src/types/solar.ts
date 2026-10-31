// ----------------------------------------------------
// ENUMS & CONSTANTS
// ----------------------------------------------------

export type UserRole =
  | "DIRECTOR"
  | "ADMIN"
  | "SALES"
  | "SURVEYOR"
  | "WAREHOUSE"
  | "LEAD_TECHNICIAN"
  | "FIELD_RIGGER"
  | "SUPPORT";

export type SystemType = "ON_GRID" | "OFF_GRID" | "HYBRID";

export type RoofType = "FLAT_RCC" | "METAL_SHEET" | "TILED" | "GROUND_MOUNT";

export type ProjectStatus =
  | "LEAD_RECEIVED"
  | "SURVEY_SCHEDULED"
  | "SURVEY_APPROVED"
  | "QUOTE_ACCEPTED"
  | "DISPATCH_PENDING"
  | "DISPATCHED"
  | "INSTALLATION_IN_PROGRESS"
  | "COMMISSIONED"
  | "DISCOM_SYNCED"
  | "CANCELLED";

export type ComponentCategory =
  | "PANEL"
  | "INVERTER"
  | "BATTERY"
  | "CHARGE_CONTROLLER"
  | "STRUCTURE"
  | "BALANCE_OF_SYSTEM"
  | "SAFETY_EARTHING";

export type SerialStatus =
  | "IN_STOCK"
  | "DISPATCHED"
  | "INSTALLED"
  | "FAILED_RMA"
  | "RETURNED_TO_VENDOR";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type BillingType = "WARRANTY_FREE" | "BILLABLE";

// ----------------------------------------------------
// CORE ENTITIES
// ----------------------------------------------------

export interface User {
  id: number;
  employeeCode: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: UserRole;
  monthlySalary?: number | string;
  dailyLaborRate?: number | string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  customerCode: string;
  fullName: string;
  phone: string;
  email?: string | null;
  installationAddress: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageTemplate {
  id: number;
  packageCode: string;
  name: string;
  capacityKw: number | string;
  systemType: SystemType;
  panelCount: number;
  inverterRatingKw: number | string;
  batteryCapacityAh?: number | null;
  baseHardwareCost: number | string;
  baseLaborCost: number | string;
  defaultPrice: number | string;
  isActive: boolean;
}

export interface SiteSurvey {
  id: number;
  projectId: number;
  surveyorId: number;
  roofType: RoofType;
  usableAreaSqFt: number | string;
  isSouthFacing: boolean;
  tiltAngleDeg: number | string;
  hasShadingIssue: boolean;
  parapetHeightFt: number | string;
  dcCableRunMtrs: number | string;
  acCableRunMtrs: number | string;
  earthPitViable: boolean;
  isApproved: boolean;
  rejectionReason?: string | null;
  surveyNotes?: string | null;
  surveyDate: string;
  surveyor?: {
    fullName: string;
    employeeCode: string;
    email?: string;
  };
}

export interface StockItem {
  id: number;
  sku: string;
  modelName: string;
  category: ComponentCategory;
  unitCost: number | string;
  quantityOnHand: number;
  warrantyMonths: number;
}

export interface SerialRegistry {
  id: number;
  serialNumber: string;
  stockItemId: number;
  projectId?: number | null;
  status: SerialStatus;
  isDispatched: boolean;
  warrantyEndDate?: string | null;
  dispatchedAt?: string | null;
  stockItem?: StockItem;
}

export interface InstallationRecord {
  id: number;
  projectId: number;
  leadTechnicianId: number;
  transitReceivedAt: string;
  civilPadsCompleted: boolean;
  groutCuringVerified: boolean;
  structureTorqued: boolean;
  dcConduitCompleted: boolean;
  earthPitsCompleted: boolean;
  vocVolts: number | string;
  iscAmperes: number | string;
  earthResistanceOhms: number | string;
  roofPhotoUrl?: string | null;
  customerSignatureSvg: string;
  installedAt: string;
  leadTechnician?: {
    fullName: string;
    employeeCode: string;
  };
}

export interface SupportTicket {
  id: number;
  ticketCode: string;
  projectId: number;
  customerId: number;
  assignedToId?: number | null;
  status: TicketStatus;
  billingType: BillingType;
  reportedIssue: string;
  faultySerialNumber?: string | null;
  replacedWithSerial?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  project?: Project;
  assignedTo?: {
    fullName: string;
    employeeCode: string;
    phone?: string | null;
  } | null;
}

export interface Project {
  id: number;
  projectCode: string;
  customerId: number;
  packageTemplateId?: number | null;
  systemCapacityKw: number | string;
  systemType: SystemType;
  status: ProjectStatus;

  consumerAccountNumber?: string | null;
  sanctionedLoadKw?: number | string | null;
  monthlyPowerBill?: number | string | null;

  totalQuotedPrice: number | string;
  bookingAdvancePaid: number | string;
  dispatchPaymentPaid: number | string;
  finalBalancePaid: number | string;

  freightCost?: number | string;
  civilMaterialCost?: number | string;
  directLaborCost?: number | string;

  discomApplicationNumber?: string | null;
  bidirectionalMeterSerial?: string | null;
  isGridSynchronized: boolean;
  gridSyncDate?: string | null;

  createdAt: string;
  updatedAt: string;

  customer: Customer;
  packageTemplate?: PackageTemplate | null;
  siteSurvey?: SiteSurvey | null;
  dispatchedSerials?: SerialRegistry[];
  installationRecord?: InstallationRecord[];
  supportTickets?: SupportTicket[];
}

// ----------------------------------------------------
// ANALYTICS & DASHBOARD PAYLOADS
// ----------------------------------------------------

export interface ProjectFinancialItem {
  id: number;
  projectCode: string;
  customerName: string;
  phone: string;
  status: ProjectStatus;
  systemType: SystemType;
  capacityKw: number;
  totalQuotedPrice: number;
  collectedAmount: number;
  outstandingReceivable: number;
  costBreakdown: {
    hardwareCost: number;
    freightCost: number;
    civilMaterialCost: number;
    directLaborCost: number;
    totalJobCost: number;
  };
  grossMargin: number;
  marginPercentage: number;
  isProfitable: boolean;
}

export interface MonthEndExecutiveSummary {
  totalRevenueQuoted: number;
  totalCollectedSoFar: number;
  totalOutstandingReceivables: number;
  totalExecutionCosts: number;
  netOperatingProfit: number;
  fixedMonthlyPayrollOverhead: number;
  activeStaffCount: number;
  openServiceTicketsCount: number;
  totalProjectsInPipeline: number;
}