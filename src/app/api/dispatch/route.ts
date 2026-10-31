import { NextRequest } from "next/server";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { dispatchScanSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "WAREHOUSE"]);
    const body = await req.json();
    const valid = dispatchScanSchema.parse(body);

    const serialList = valid.scannedSerialNumbers ?? (valid.serialNumber ? [valid.serialNumber] : []);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify project exists
      const project = await tx.project.findUnique({
        where: { id: valid.projectId },
      });

      if (!project) {
        throw new ApiError(404, "NOT_FOUND", "Project not found.");
      }

      // 2. Query all requested serial numbers
      const serialRecords = await tx.serialRegistry.findMany({
        where: {
          serialNumber: { in: serialList },
        },
        include: {
          stockItem: true,
        },
      });

      if (serialRecords.length !== serialList.length) {
        const found = serialRecords.map((s) => s.serialNumber);
        const missing = serialList.filter((s) => !found.includes(s));
        throw new ApiError(
          404,
          "SERIAL_NOT_FOUND",
          `Serial number(s) not found in registry: ${missing.join(", ")}`
        );
      }

      // 3. Ensure none are already assigned to a DIFFERENT project
      for (const record of serialRecords) {
        if (record.isDispatched && record.projectId && record.projectId !== project.id) {
          throw new ApiError(
            400,
            "SERIAL_ALREADY_ASSIGNED",
            `Serial '${record.serialNumber}' is already dispatched to project '${record.projectId}'.`
          );
        }
      }

      const now = new Date();

      // 4. Update each serial record and decrement stock if not already dispatched
      for (const record of serialRecords) {
        const warrantyEndDate = addMonths(now, record.stockItem.warrantyMonths);

        await tx.serialRegistry.update({
          where: { id: record.id },
          data: {
            projectId: project.id,
            isDispatched: true,
            dispatchedAt: record.dispatchedAt || now,
            warrantyStartDate: record.warrantyStartDate || now,
            warrantyEndDate: record.warrantyEndDate || warrantyEndDate,
            status: "ACTIVE",
          },
        });

        if (!record.isDispatched) {
          await tx.stockItem.update({
            where: { id: record.stockItemId },
            data: {
              quantityOnHand: {
                decrement: 1,
              },
            },
          });
        }
      }

      // 5. Check if project is ready to transition to DISPATCHED
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: { status: "DISPATCHED" },
      });

      const firstRecord = serialRecords[0];

      return {
        serialNumber: firstRecord?.serialNumber || "",
        category: firstRecord?.stockItem.category || "EQUIPMENT",
        modelName: firstRecord?.stockItem.modelName || "Hardware Unit",
        dispatchedAt: now.toISOString(),
        projectStatus: updatedProject.status,
        project: updatedProject,
        dispatchedCount: serialRecords.length,
      };
    });

    return apiSuccess(result);
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
