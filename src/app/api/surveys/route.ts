import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteSurveySchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = requireRole(req, ["ADMIN", "SURVEYOR"]);
    const body = await req.json();
    const valid = siteSurveySchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: valid.projectId },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    if (project.status !== "LEAD_RECEIVED" && project.status !== "SURVEY_PENDING") {
      throw new ApiError(
        400,
        "INVALID_STATE_TRANSITION",
        `Cannot submit survey for a project in '${project.status}' status.`
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const survey = await tx.siteSurvey.create({
        data: {
          projectId: valid.projectId,
          surveyorId: session.userId,
          roofUsableAreaSqm: valid.roofUsableAreaSqm,
          tiltDegrees: valid.tiltDegrees,
          azimuthDegrees: valid.azimuthDegrees,
          cableRunMeters: valid.cableRunMeters,
          sanctionedLoadKw: valid.sanctionedLoadKw,
          isShadowFree: valid.isShadowFree,
          isViable: valid.isViable,
          notes: valid.notes,
        },
      });

      const nextStatus = valid.isViable ? "SURVEY_APPROVED" : "REJECTED";

      const updatedProject = await tx.project.update({
        where: { id: valid.projectId },
        data: { status: nextStatus },
      });

      return { survey, project: updatedProject };
    });

    return apiSuccess(updated, 201);
  } catch (error) {
    return handleApiError(error);
  }
}