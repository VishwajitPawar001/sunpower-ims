import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { BillingType, TicketStatus, UserRole } from "@prisma/client";

// GET /api/tickets - List support tickets with filter and search capability
export async function GET(req: NextRequest) {
  try {
    requireRole(req, [UserRole.SUPPORT, UserRole.LEAD_TECHNICIAN, UserRole.ADMIN, UserRole.DIRECTOR]);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as TicketStatus | null;
    const search = searchParams.get("search");

    const whereClause: Record<string, unknown> = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { ticketCode: { contains: search, mode: "insensitive" } },
        { faultySerialNumber: { contains: search, mode: "insensitive" } },
        { customer: { phone: { contains: search } } },
        { customer: { fullName: { contains: search, mode: "insensitive" } } },
        { project: { projectCode: { contains: search, mode: "insensitive" } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: {
        customer: true,
        project: {
          include: {
            packageTemplate: true,
            dispatchedSerials: { include: { stockItem: true } },
          },
        },
        assignedTo: {
          select: { fullName: true, employeeCode: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(tickets);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/tickets - Intake support ticket with automatic warranty evaluation
export async function POST(req: NextRequest) {
  try {
    requireRole(req, [UserRole.SUPPORT, UserRole.ADMIN, UserRole.DIRECTOR]);

    const body = await req.json();
    const {
      projectId,
      reportedIssue,
      faultySerialNumber,
      assignedToId,
    } = body;

    if (!projectId || !reportedIssue) {
      throw new ApiError(400, "BAD_REQUEST", "projectId and reportedIssue are required.");
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: { customer: true, dispatchedSerials: true },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    // Determine warranty coverage automatically
    let billingType = BillingType.WARRANTY_FREE;

    if (faultySerialNumber) {
      const serial = await prisma.serialRegistry.findUnique({
        where: { serialNumber: String(faultySerialNumber).trim() },
      });

      if (serial && serial.warrantyEndDate) {
        const isExpired = new Date() > new Date(serial.warrantyEndDate);
        if (isExpired) {
          billingType = BillingType.BILLABLE;
        }
      }
    }

    // Generate sequential ticket code: TCK-#####
    const ticketCount = await prisma.supportTicket.count();
    const nextTicketNum = String(ticketCount + 1).padStart(5, "0");
    const ticketCode = `TCK-${nextTicketNum}`;

    const newTicket = await prisma.supportTicket.create({
      data: {
        ticketCode,
        projectId: project.id,
        customerId: project.customerId,
        assignedToId: assignedToId ? Number(assignedToId) : null,
        status: TicketStatus.OPEN,
        billingType,
        reportedIssue: String(reportedIssue).trim(),
        faultySerialNumber: faultySerialNumber ? String(faultySerialNumber).trim() : null,
      },
      include: {
        customer: true,
        project: true,
        assignedTo: {
          select: { fullName: true, employeeCode: true },
        },
      },
    });

    return apiSuccess(newTicket, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
