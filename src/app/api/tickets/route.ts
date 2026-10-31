import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { supportTicketSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SUPPORT", "SALES"]);
    const body = await req.json();
    const valid = supportTicketSchema.parse(body);

    let targetProjectId = valid.projectId;
    let serialId: string | null = null;
    let isCovered = true;

    if (valid.serialNumber) {
      const serial = await prisma.serialRegistry.findUnique({
        where: { serialNumber: valid.serialNumber },
      });

      if (serial) {
        serialId = serial.id;
        if (!targetProjectId && serial.projectId) {
          targetProjectId = serial.projectId;
        }
        const now = new Date();
        isCovered = serial.warrantyEndDate !== null && now <= serial.warrantyEndDate;
      }
    }

    if (!targetProjectId) {
      const firstProject = await prisma.project.findFirst({
        orderBy: { createdAt: "desc" },
      });
      if (!firstProject) {
        throw new ApiError(404, "NOT_FOUND", "No project found to associate with support ticket.");
      }
      targetProjectId = firstProject.id;
    }

    const ticketNumber = `TCK-${Date.now().toString().slice(-6)}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        projectId: targetProjectId,
        serialRegistryId: serialId,
        reportedFaultCode: valid.reportedFaultCode || "FAULT-GENERIC",
        description: valid.description,
        isCoveredUnderWarranty: isCovered,
        billableAmount: isCovered ? 0.0 : 1500.0,
        status: "OPEN",
      },
      include: {
        project: {
          include: { customer: true },
        },
      },
    });

    return apiSuccess(ticket, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SUPPORT", "TECHNICIAN", "SALES"]);

    const tickets = await prisma.supportTicket.findMany({
      include: {
        project: {
          select: {
            id: true,
            projectCode: true,
            status: true,
            customer: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const mappedTickets = tickets.map((t) => ({
      id: t.id,
      ticketCode: t.ticketNumber,
      projectId: t.projectId,
      projectCode: t.project?.projectCode || "PRJ-UNKNOWN",
      customerName: t.project?.customer?.fullName || "Valued Customer",
      issueDescription: t.description,
      priority: t.reportedFaultCode.includes("03") || t.reportedFaultCode.includes("ERR") ? "HIGH" : "LOW",
      status: t.status,
      billableAmount: Number(t.billableAmount),
      isCoveredUnderWarranty: t.isCoveredUnderWarranty,
      reportedFaultCode: t.reportedFaultCode,
      createdAt: t.createdAt.toISOString().split("T")[0],
    }));

    return apiSuccess({
      count: mappedTickets.length,
      tickets: mappedTickets,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
