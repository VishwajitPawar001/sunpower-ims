
import { NextRequest } from "next/server";
import { addMonths } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchScanSchema } from "@/lib/validations";
import {
  handleApiError,
  apiSuccess,
  ApiError,
} from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "WAREHOUSE"]);

    const body = await req.json();
    const valid = dispatchScanSchema.parse(body);

    // Reject duplicate serial numbers in the same request.
    const uniqueSerials = new Set(valid.scannedSerialNumbers);

    if (uniqueSerials.size !== valid.scannedSerialNumbers.length) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Duplicate serial numbers are not allowed."
      );
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Verify project status.
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
            `Cannot dispatch. Project status is '${project.status}', expected 'ORDER_CONFIRMED'.`
          );
        }

        // 2. Find all requested serial numbers.
        const serialRecords = await tx.serialRegistry.findMany({
          where: {
            serialNumber: { in: valid.scannedSerialNumbers },
          },
          include: {
            stockItem: true,
          },
        });

        if (serialRecords.length !== valid.scannedSerialNumbers.length) {
          const found = new Set(
            serialRecords.map((record) => record.serialNumber)
          );

          const missing = valid.scannedSerialNumbers.filter(
            (serial) => !found.has(serial)
          );

          throw new ApiError(
            400,
            "TRANSACTION_CONFLICT",
            `Unknown serial numbers: ${missing.join(", ")}`
          );
        }

        // 3. Ensure every serial is available.
        for (const record of serialRecords) {
          if (record.isDispatched || record.projectId !== null) {
            throw new ApiError(
              400,
              "TRANSACTION_CONFLICT",
              `Serial '${record.serialNumber}' is already dispatched or assigned.`
            );
          }
        }

        // 4. Group serials by stock item.
        const quantities = new Map<string, number>();

        for (const record of serialRecords) {
          quantities.set(
            record.stockItemId,
            (quantities.get(record.stockItemId) ?? 0) + 1
          );
        }

        // 5. Decrement stock only when sufficient quantity exists.
        for (const [stockItemId, quantity] of quantities) {
          const stockUpdate = await tx.stockItem.updateMany({
            where: {
              id: stockItemId,
              quantityOnHand: { gte: quantity },
            },
            data: {
              quantityOnHand: { decrement: quantity },
            },
          });

          if (stockUpdate.count !== 1) {
            throw new ApiError(
              409,
              "INSUFFICIENT_STOCK",
              `Insufficient stock for item ${stockItemId}.`
            );
          }
        }

        // 6. Assign serials only if they are still available.
        const now = new Date();

        const serialUpdate = await tx.serialRegistry.updateMany({
          where: {
            id: { in: serialRecords.map((record) => record.id) },
            isDispatched: false,
            projectId: null,
          },
          data: {
            projectId: project.id,
            isDispatched: true,
            dispatchedAt: now,
            warrantyStartDate: now,
            status: "ACTIVE",
          },
        });

        if (serialUpdate.count !== serialRecords.length) {
          throw new ApiError(
            409,
            "TRANSACTION_CONFLICT",
            "One or more serial numbers were dispatched by another request."
          );
        }

        // 7. Calculate warranty end dates.
        for (const record of serialRecords) {
          await tx.serialRegistry.update({
            where: { id: record.id },
            data: {
              warrantyEndDate: addMonths(
                now,
                record.stockItem.warrantyMonths
              ),
            },
          });
        }

        // 8. Change project status only if it is still confirmed.
        const projectUpdate = await tx.project.updateMany({
          where: {
            id: project.id,
            status: "ORDER_CONFIRMED",
          },
          data: {
            status: "DISPATCHED",
          },
        });

        if (projectUpdate.count !== 1) {
          throw new ApiError(
            409,
            "TRANSACTION_CONFLICT",
            "Project status changed during dispatch."
          );
        }

        return {
          projectId: project.id,
          status: "DISPATCHED",
          dispatchedCount: serialRecords.length,
          dispatchedSerialNumbers: serialRecords.map(
            (record) => record.serialNumber
          ),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
