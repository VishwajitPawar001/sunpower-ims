import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commissioningSignSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authUser = requireRole(req, ["ADMIN", "TECHNICIAN"]);
    const body = await req.json();
    const valid = commissioningSignSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: valid.projectId },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    if (project.status !== "DISPATCHED") {
      throw new ApiError(
        400,
        "INVALID_STATE_TRANSITION",
        `Cannot commission system. Project is in '${project.status}' state, expected 'DISPATCHED'.`
      );
    }

    // Atomic execution: record sign-off and transition project state
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.commissioningRecord.create({
        data: {
          projectId: valid.projectId,
          leadTechnicianId: authUser.userId,
          vocVoltsMeasured: valid.vocVoltsMeasured,
          iscAmpsMeasured: valid.iscAmpsMeasured,
          earthingResistanceOhms: valid.earthingResistanceOhms,
          completionPhotoUrl: valid.completionPhotoUrl,
          customerSignatureSvg: valid.customerSignatureSvg,
          signedAt: new Date(),
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: valid.projectId },
        data: {
          status: "COMMISSIONED",
        },
      });

      return { record, project: updatedProject };
    });

    return apiSuccess({
      message: "Commissioning sign-off completed successfully.",
      commissioningRecord: result.record,
      project: result.project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}