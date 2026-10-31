import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";
import { updateTicketSchema } from "@/lib/validations";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SUPPORT", "TECHNICIAN"]);
    const { id: ticketId } = await params;
    const body = await req.json();
    const valid = updateTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { project: true },
    });

    if (!ticket) {
      throw new ApiError(404, "NOT_FOUND", "Support ticket not found.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (valid.replacementSerial && ticket.projectId) {
        const newSerial = await tx.serialRegistry.findUnique({
          where: { serialNumber: valid.replacementSerial },
        });

        if (!newSerial) {
          throw new ApiError(
            404,
            "SERIAL_NOT_FOUND",
            `Replacement serial '${valid.replacementSerial}' does not exist in inventory.`
          );
        }

        if (newSerial.isDispatched) {
          throw new ApiError(
            400,
            "SERIAL_ALREADY_ASSIGNED",
            `Replacement serial '${valid.replacementSerial}' is already assigned or dispatched.`
          );
        }

        await tx.serialRegistry.update({
          where: { serialNumber: valid.replacementSerial },
          data: {
            projectId: ticket.projectId,
            isDispatched: true,
            warrantyStartDate: new Date(),
          },
        });
      }

      return await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: valid.status,
          ...(valid.description ? { description: valid.description } : {}),
        },
      });
    });

    return apiSuccess({
      message: "Ticket updated successfully.",
      ticket: updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
