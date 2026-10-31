import { z } from 'zod';

export const customerLeadSchema = z
  .object({
    fullName: z.string().min(2).max(150),
    phone: z.string().min(8).max(20),
    email: z.string().email().optional().or(z.literal('')),
    installationAddress: z.string().min(5),
    capacityKw: z.number().positive().max(100),
    systemType: z.enum(['ON_GRID', 'OFF_GRID']),
  })
  .strict();

export const siteSurveySchema = z
  .object({
    projectId: z.string().uuid(),
    roofUsableAreaSqm: z.number().positive().max(10000),
    tiltDegrees: z.number().min(0).max(90),
    azimuthDegrees: z.number().min(0).max(360),
    cableRunMeters: z.number().positive().max(500),
    sanctionedLoadKw: z.number().positive().max(100),
    isShadowFree: z.boolean(),
    isViable: z.boolean(),
    notes: z.string().max(1000).optional(),
  })
  .strict();

export const dispatchScanSchema = z
  .object({
    projectId: z.string().uuid(),
    scannedSerialNumbers: z.array(z.string().min(3)).min(1),
  })
  .strict();

export const supportTicketSchema = z
  .object({
    projectId: z.string().uuid(),
    serialNumber: z.string().min(3),
    reportedFaultCode: z.string().max(50).optional(),
    description: z.string().min(5).max(2000),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
  })
  .strict();

export const quoteGenerateSchema = z
  .object({
    projectId: z.string().uuid(),
    marginMarkupPercent: z.number().min(0).max(100).default(15), // standard margin
  })
  .strict();

export const orderConfirmSchema = z
  .object({
    projectId: z.string().uuid(),
    agreedPrice: z.number().positive(),
  })
  .strict();

export const commissioningSignSchema = z
  .object({
    projectId: z.string().uuid('Invalid project ID format'),
    vocVoltsMeasured: z.number().positive('Voc must be positive'),
    iscAmpsMeasured: z.number().positive('Isc must be positive'),
    earthingResistanceOhms: z
      .number()
      .positive('Earthing resistance must be positive'),
    completionPhotoUrl: z.string().url('Must be a valid photo URL'),
    customerSignatureSvg: z
      .string()
      .min(10, 'Valid SVG path signature required'),
  })
  .strict();

export const updateTicketSchema = z
  .object({
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
    description: z.string().min(5, "Description must be at least 5 characters").optional(),
    replacementSerial: z.string().optional(),
  })
  .strict();