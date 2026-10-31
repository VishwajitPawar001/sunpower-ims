import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supportTicketSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "SUPPORT"]);
    const body = await req.json();
    const valid = supportTicketSchema.parse(body);

    const serial = await prisma.serialRegistry.findUnique({
      where: { serialNumber: valid.serialNumber },
    });

    if (!serial || !serial.isDispatched) {
      throw new ApiError(
        404,
        "NOT_FOUND",
        `Serial '${valid.serialNumber}' was not found or has never been dispatched.`
      );
    }

    const now = new Date();
    const isCovered =
      serial.warrantyEndDate !== null && now <= serial.warrantyEndDate;

    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        projectId: valid.projectId,
        serialRegistryId: serial.id,
        reportedFaultCode: valid.reportedFaultCode || "UNSPECIFIED",
        description: valid.description,
        isCoveredUnderWarranty: isCovered,
        billableAmount: isCovered ? 0.0 : 1500.0,
        status: "OPEN",
      },
    });

    return apiSuccess(ticket, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "SUPPORT", "TECHNICIAN", "SALES"]);

    const tickets = await prisma.supportTicket.findMany({
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return apiSuccess({
      count: tickets.length,
      tickets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}