import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderConfirmSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SALES"]);
    const body = await req.json();
    const valid = orderConfirmSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: valid.projectId },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    const confirmedProject = await prisma.project.update({
      where: { id: valid.projectId },
      data: {
        status: "ORDER_CONFIRMED",
        agreedPrice: valid.agreedPrice,
      },
    });

    return apiSuccess({
      message: "Order successfully confirmed. Project is ready for warehouse serial dispatch.",
      project: confirmedProject,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
