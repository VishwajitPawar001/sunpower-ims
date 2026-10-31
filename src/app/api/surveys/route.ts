import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteSurveySchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = requireRole(req, ["ADMIN", "DIRECTOR", "SURVEYOR"]);
    const body = await req.json();
    const valid = siteSurveySchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: valid.projectId },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    const usableArea = valid.roofUsableAreaSqm ?? valid.usableAreaSqm ?? 25.0;
    const nextStatus = valid.isViable ? "SURVEY_APPROVED" : "REJECTED";

    const updated = await prisma.$transaction(async (tx) => {
      const survey = await tx.siteSurvey.upsert({
        where: { projectId: valid.projectId },
        update: {
          surveyorId: session.userId,
          roofUsableAreaSqm: usableArea,
          tiltDegrees: valid.tiltDegrees,
          azimuthDegrees: valid.azimuthDegrees,
          cableRunMeters: valid.cableRunMeters,
          sanctionedLoadKw: valid.sanctionedLoadKw,
          isShadowFree: valid.isShadowFree,
          isViable: valid.isViable,
          notes: valid.notes || null,
        },
        create: {
          projectId: valid.projectId,
          surveyorId: session.userId,
          roofUsableAreaSqm: usableArea,
          tiltDegrees: valid.tiltDegrees,
          azimuthDegrees: valid.azimuthDegrees,
          cableRunMeters: valid.cableRunMeters,
          sanctionedLoadKw: valid.sanctionedLoadKw,
          isShadowFree: valid.isShadowFree,
          isViable: valid.isViable,
          notes: valid.notes || null,
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: valid.projectId },
        data: { status: nextStatus },
      });

      return {
        surveyId: survey.id,
        projectStatus: nextStatus,
        survey,
        project: updatedProject,
      };
    });

    return apiSuccess(updated, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SURVEYOR", "SALES"]);
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (projectId) {
      const survey = await prisma.siteSurvey.findUnique({
        where: { projectId },
        include: { project: true, surveyor: true },
      });
      return apiSuccess({ survey });
    }

    const surveys = await prisma.siteSurvey.findMany({
      include: { project: { include: { customer: true } } },
      orderBy: { surveyedAt: "desc" },
    });

    return apiSuccess({ count: surveys.length, surveys });
  } catch (error) {
    return handleApiError(error);
  }
}
