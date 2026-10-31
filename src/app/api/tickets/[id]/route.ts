import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { SerialStatus, TicketStatus, UserRole } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/tickets/[id] - Fetch detailed ticket record
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    requireRole(req, [UserRole.SUPPORT, UserRole.LEAD_TECHNICIAN, UserRole.ADMIN, UserRole.DIRECTOR]);

    const resolvedParams = await params;
    const ticketId = Number(resolvedParams.id);

    if (isNaN(ticketId)) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid ticket ID parameter.");
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        project: {
          include: {
            packageTemplate: true,
            dispatchedSerials: { include: { stockItem: true } },
            installationRecord: true,
          },
        },
        assignedTo: {
          select: { fullName: true, employeeCode: true, phone: true, role: true },
        },
      },
    });

    if (!ticket) {
      throw new ApiError(404, "NOT_FOUND", "Support ticket not found.");
    }

    return apiSuccess(ticket);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH /api/tickets/[id] - Update ticket, assign tech, resolve, or execute RMA component swap
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    requireRole(req, [UserRole.SUPPORT, UserRole.LEAD_TECHNICIAN, UserRole.ADMIN, UserRole.DIRECTOR]);

    const resolvedParams = await params;
    const ticketId = Number(resolvedParams.id);

    if (isNaN(ticketId)) {
      throw new ApiError(400, "BAD_REQUEST", "Invalid ticket ID parameter.");
    }

    const body = await req.json();
    const {
      status,
      assignedToId,
      resolutionNotes,
      faultySerialNumber,
      replacementSerialNumber,
    } = body;

    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { project: true },
    });

    if (!existingTicket) {
      throw new ApiError(404, "NOT_FOUND", "Support ticket not found.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. If an RMA hardware swap is specified
      if (faultySerialNumber && replacementSerialNumber) {
        const cleanFaulty = String(faultySerialNumber).trim();
        const cleanReplacement = String(replacementSerialNumber).trim();

        // Flag defective serial as FAILED_RMA and detach from project
        const faultyItem = await tx.serialRegistry.findUnique({
          where: { serialNumber: cleanFaulty },
        });

        if (faultyItem) {
          await tx.serialRegistry.update({
            where: { serialNumber: cleanFaulty },
            data: {
              status: SerialStatus.FAILED_RMA,
              projectId: null,
            },
          });
        }

        // Verify replacement serial exists and is in stock
        const replacementItem = await tx.serialRegistry.findUnique({
          where: { serialNumber: cleanReplacement },
          include: { stockItem: true },
        });

        if (!replacementItem) {
          throw new ApiError(404, "NOT_FOUND", `Replacement serial '${cleanReplacement}' not found in registry.`);
        }

        if (replacementItem.status !== SerialStatus.IN_STOCK || replacementItem.isDispatched) {
          throw new ApiError(
            400,
            "SERIAL_UNAVAILABLE",
            `Replacement serial '${cleanReplacement}' is not available in stock.`
          );
        }

        // Bind replacement serial to the customer's project and start its warranty
        const now = new Date();
        const warrantyEnd = new Date(now);
        warrantyEnd.setMonth(warrantyEnd.getMonth() + (replacementItem.stockItem.warrantyMonths || 24));

        await tx.serialRegistry.update({
          where: { serialNumber: cleanReplacement },
          data: {
            projectId: existingTicket.projectId,
            status: SerialStatus.INSTALLED,
            isDispatched: true,
            dispatchedAt: now,
            warrantyEndDate: warrantyEnd,
          },
        });

        // Deduct 1 unit from stock quantity
        await tx.stockItem.update({
          where: { id: replacementItem.stockItemId },
          data: { quantityOnHand: { decrement: 1 } },
        });
      }

      // 2. Update the SupportTicket record
      return await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: status || existingTicket.status,
          assignedToId: assignedToId !== undefined ? (assignedToId ? Number(assignedToId) : null) : existingTicket.assignedToId,
          resolutionNotes: resolutionNotes !== undefined ? resolutionNotes : existingTicket.resolutionNotes,
          faultySerialNumber: faultySerialNumber ? String(faultySerialNumber).trim() : existingTicket.faultySerialNumber,
          replacedWithSerial: replacementSerialNumber ? String(replacementSerialNumber).trim() : existingTicket.replacedWithSerial,
        },
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
      });
    });

    return apiSuccess(updated);
  } catch (error) {
    return handleApiError(error);
  }
}