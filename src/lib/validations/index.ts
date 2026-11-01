import { z } from 'zod';

export const customerLeadSchema = z
  .object({
    fullName: z.string().min(2).max(150).optional(),
    customerName: z.string().min(2).max(150).optional(),
    phone: z.string().min(8).max(20),
    email: z.string().email().optional().or(z.literal('')).nullable(),
    installationAddress: z.string().min(5).optional(),
    address: z.string().min(5).optional(),
    capacityKw: z.coerce.number().positive().max(100),
    systemType: z.enum(['ON_GRID', 'OFF_GRID', 'HYBRID']),
  })
  .refine((data) => !!(data.fullName || data.customerName), {
    message: 'Customer name is required',
    path: ['customerName'],
  })
  .refine((data) => !!(data.installationAddress || data.address), {
    message: 'Installation address is required',
    path: ['address'],
  });

export const siteSurveySchema = z
  .object({
    projectId: z.string().uuid(),
    roofUsableAreaSqm: z.coerce.number().positive().max(10000).optional(),
    usableAreaSqm: z.coerce.number().positive().max(10000).optional(),
    tiltDegrees: z.coerce.number().min(0).max(90),
    azimuthDegrees: z.coerce.number().min(0).max(360),
    cableRunMeters: z.coerce.number().positive().max(500),
    sanctionedLoadKw: z.coerce.number().positive().max(100),
    isShadowFree: z.boolean(),
    isViable: z.boolean(),
    notes: z.string().max(1000).optional().nullable(),
  })
  .refine((data) => data.roofUsableAreaSqm !== undefined || data.usableAreaSqm !== undefined, {
    message: 'Usable area is required',
    path: ['usableAreaSqm'],
  });

export const dispatchScanSchema = z
  .object({
    projectId: z.string().uuid(),
    scannedSerialNumbers: z.array(z.string().min(3)).min(1).optional(),
    serialNumber: z.string().min(3).optional(),
  })
  .refine((data) => (data.scannedSerialNumbers && data.scannedSerialNumbers.length > 0) || !!data.serialNumber, {
    message: 'At least one serial number is required',
    path: ['serialNumber'],
  });

export const supportTicketSchema = z
  .object({
    projectId: z.string().uuid().optional(),
    serialNumber: z.string().min(3).optional(),
    reportedFaultCode: z.string().max(50).optional().nullable(),
    description: z.string().min(5).max(2000),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  });

export const quoteGenerateSchema = z
  .object({
    projectId: z.string().uuid(),
    marginMarkupPercent: z.coerce.number().min(0).max(100).default(15),
    agreedPrice: z.coerce.number().positive().optional(),
    capacityKw: z.coerce.number().positive().optional(),
    systemType: z.enum(['ON_GRID', 'OFF_GRID', 'HYBRID']).optional(),
  });

export const orderConfirmSchema = z
  .object({
    projectId: z.string().uuid(),
    agreedPrice: z.coerce.number().positive(),
  });

export const commissioningSignSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID format'),
    vocVoltsMeasured: z.coerce.number().positive().optional(),
    vocVolts: z.coerce.number().positive().optional(),
    iscAmpsMeasured: z.coerce.number().positive().optional(),
    iscAmperes: z.coerce.number().positive().optional(),
    earthingResistanceOhms: z.coerce.number().positive('Earthing resistance must be positive'),
    completionPhotoUrl: z.string().optional(),
    customerSignatureSvg: z.string().min(10).optional(),
    signatureSvg: z.string().min(10).optional(),
  })
  .refine((data) => data.vocVoltsMeasured !== undefined || data.vocVolts !== undefined, {
    message: 'Voc volts is required',
    path: ['vocVolts'],
  })
  .refine((data) => data.iscAmpsMeasured !== undefined || data.iscAmperes !== undefined, {
    message: 'Isc amps is required',
    path: ['iscAmperes'],
  })
  .refine((data) => !!(data.customerSignatureSvg || data.signatureSvg), {
    message: 'Customer signature is required',
    path: ['signatureSvg'],
  });

export const updateTicketSchema = z
  .object({
    status: z.enum([
  "OPEN",
  "INVESTIGATING",
  "PARTS_REPLACED",
  "RESOLVED",
  "CLOSED",
  ]),
    description: z.string().min(5, "Description must be at least 5 characters").optional(),
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
    description: z
      .string()
      .min(5, 'Description must be at least 5 characters')
      .optional(),
    replacementSerial: z.string().optional(),
  });

export const loginSchema = z
  .object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });

export const createUserSchema = z
  .object({
    email: z.string().email('Valid email is required'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    role: z.enum([
      'ADMIN',
      'DIRECTOR',
      'SALES',
      'SURVEYOR',
      'WAREHOUSE',
      'TECHNICIAN',
      'SUPPORT',
    ]),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });
