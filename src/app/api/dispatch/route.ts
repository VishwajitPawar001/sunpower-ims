import { NextRequest } from "next/server";
import { addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { dispatchScanSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "WAREHOUSE"]);
    const body = await req.json();
    const valid = dispatchScanSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify project exists and is in ORDER_CONFIRMED status
      const project = await tx.project.findUnique({
        where: { id: valid.projectId },
      });

      if (!project) {
        throw new ApiError(404, "NOT_FOUND", "Project not found.");
      }

      if (project.status !== "ORDER_CONFIRMED") {
        throw new ApiError(
          400,
          "INVALID_STATE_TRANSITION",
          `Cannot dispatch inventory. Project is in '${project.status}' state, expected 'ORDER_CONFIRMED'.`
        );
      }

      // 2. Query all requested serial numbers
      const serialRecords = await tx.serialRegistry.findMany({
        where: {
          serialNumber: { in: valid.scannedSerialNumbers },
        },
        include: {
          stockItem: true,
        },
      });

      if (serialRecords.length !== valid.scannedSerialNumbers.length) {
        const found = serialRecords.map((s) => s.serialNumber);
        const missing = valid.scannedSerialNumbers.filter((s) => !found.includes(s));
        throw new ApiError(
          400,
          "TRANSACTION_CONFLICT",
          `Serial numbers not recognized in registry: ${missing.join(", ")}`
        );
      }

      // 3. Ensure none are already assigned or dispatched
      for (const record of serialRecords) {
        if (record.isDispatched || record.projectId !== null) {
          throw new ApiError(
            400,
            "TRANSACTION_CONFLICT",
            `Serial '${record.serialNumber}' is already dispatched or assigned to another project.`
          );
        }
      }

      const now = new Date();

      // 4. Update each serial record and decrement stock
      for (const record of serialRecords) {
        const warrantyEndDate = addMonths(now, record.stockItem.warrantyMonths);

        await tx.serialRegistry.update({
          where: { id: record.id },
          data: {
            projectId: project.id,
            isDispatched: true,
            dispatchedAt: now,
            warrantyStartDate: now,
            warrantyEndDate: warrantyEndDate,
            status: "ACTIVE",
          },
        });

        await tx.stockItem.update({
          where: { id: record.stockItemId },
          data: {
            quantityOnHand: {
              decrement: 1,
            },
          },
        });
      }

      // 5. Advance project state to DISPATCHED
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: { status: "DISPATCHED" },
      });

      return {
        project: updatedProject,
        dispatchedCount: serialRecords.length,
      };
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}