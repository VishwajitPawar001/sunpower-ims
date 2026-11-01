import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { ProjectStatus, SerialStatus, UserRole } from "@prisma/client";

// GET /api/dispatch - List projects ready for dispatch and available stock serials
export async function GET(req: NextRequest) {
  try {
    requireRole(req, [UserRole.WAREHOUSE, UserRole.ADMIN, UserRole.DIRECTOR]);

    const pendingProjects = await prisma.project.findMany({
      where: {
        status: {
          in: [ProjectStatus.QUOTE_ACCEPTED, ProjectStatus.DISPATCH_PENDING, ProjectStatus.DISPATCHED],
        },
      },
      include: {
        customer: true,
        packageTemplate: true,
        dispatchedSerials: {
          include: { stockItem: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const availableSerials = await prisma.serialRegistry.findMany({
      where: {
        status: SerialStatus.IN_STOCK,
        isDispatched: false,
      },
      include: { stockItem: true },
      take: 100,
    });

    return apiSuccess({
      pendingProjects,
      availableSerials,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/dispatch - Verify 70% gate, scan barcodes, bind to project and mark DISPATCHED
export async function POST(req: NextRequest) {
  try {
    requireRole(req, [UserRole.WAREHOUSE, UserRole.ADMIN, UserRole.DIRECTOR]);

    const body = await req.json();
    const { projectId, serialNumbers } = body;

    if (!projectId || !Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      throw new ApiError(400, "BAD_REQUEST", "projectId and an array of scanned serialNumbers are required.");
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: { customer: true, packageTemplate: true },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    // 1. Mandatory Milestone Gate Check: 70% payment check
    const totalQuoted = Number(project.totalQuotedPrice);
    const totalPaidSoFar = Number(project.bookingAdvancePaid) + Number(project.dispatchPaymentPaid);
    const seventyPercentGate = totalQuoted * 0.7;

    if (totalPaidSoFar < seventyPercentGate) {
      throw new ApiError(
        400,
        "PAYMENT_GATE_LOCKED",
        `Cannot dispatch kit: Minimum 70% payment required (₹${seventyPercentGate.toLocaleString()}). Total received so far: ₹${totalPaidSoFar.toLocaleString()}.`
      );
    }

    // 2. Validate and Bind Barcode Serials inside an atomic transaction
    const dispatchResult = await prisma.$transaction(async (tx) => {
      const boundSerials = [];

      for (const rawSerial of serialNumbers) {
        const serialNumber = String(rawSerial).trim();

        const item = await tx.serialRegistry.findUnique({
          where: { serialNumber },
          include: { stockItem: true },
        });

        if (!item) {
          throw new ApiError(404, "NOT_FOUND", `Hardware barcode '${serialNumber}' not registered in inventory.`);
        }

        if (item.isDispatched || item.status !== SerialStatus.IN_STOCK) {
          throw new ApiError(
            400,
            "SERIAL_ALREADY_DISPATCHED",
            `Barcode '${serialNumber}' is already dispatched or assigned to project ID ${item.projectId}.`
          );
        }

        // Bind serial to project and update status
        const updatedSerial = await tx.serialRegistry.update({
          where: { serialNumber },
          data: {
            projectId: project.id,
            status: SerialStatus.DISPATCHED,
            isDispatched: true,
            dispatchedAt: new Date(),
          },
          include: { stockItem: true },
        });

        // Deduct quantityOnHand from stock catalog
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: { quantityOnHand: { decrement: 1 } },
        });

        boundSerials.push(updatedSerial);
      }

      // Advance project status to DISPATCHED
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: { status: ProjectStatus.DISPATCHED },
        include: {
          customer: true,
          packageTemplate: true,
          dispatchedSerials: { include: { stockItem: true } },
        },
      });

      return { updatedProject, boundSerials };
    });

    return apiSuccess({
      message: `Kit successfully dispatched for project ${project.projectCode}.`,
      project: dispatchResult.updatedProject,
      dispatchedSerials: dispatchResult.boundSerials,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "WAREHOUSE", "TECHNICIAN"]);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const stockItems = await prisma.stockItem.findMany({
      include: {
        serialRegistry: {
          where: projectId ? { projectId } : undefined,
        },
      },
      orderBy: { category: "asc" },
    });

    const availableSerials = await prisma.serialRegistry.findMany({
      where: { isDispatched: false },
      include: { stockItem: true },
    });

    return apiSuccess({
      stockItems,
      availableSerials,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
