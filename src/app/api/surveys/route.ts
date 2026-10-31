import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { ProjectStatus, RoofType, UserRole } from "@prisma/client";

// GET /api/surveys - Fetch all surveys or filter by projectId
export async function GET(req: NextRequest) {
  try {
    requireRole(req, [UserRole.SURVEYOR, UserRole.SALES, UserRole.ADMIN, UserRole.DIRECTOR]);

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const whereClause = projectId ? { projectId: Number(projectId) } : {};

    const surveys = await prisma.siteSurvey.findMany({
      where: whereClause,
      include: {
        project: {
          include: { customer: true, packageTemplate: true },
        },
        surveyor: {
          select: { fullName: true, employeeCode: true, email: true },
        },
      },
      orderBy: { surveyDate: "desc" },
    });

    return apiSuccess(surveys);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/surveys - Submit site feasibility survey and gate approval
export async function POST(req: NextRequest) {
  try {
    const user = requireRole(req, [UserRole.SURVEYOR, UserRole.ADMIN, UserRole.DIRECTOR]);

    const body = await req.json();
    const {
      projectId,
      roofType = RoofType.FLAT_RCC,
      usableAreaSqFt,
      isSouthFacing = true,
      tiltAngleDeg,
      hasShadingIssue = false,
      parapetHeightFt = 0,
      dcCableRunMtrs,
      acCableRunMtrs,
      earthPitViable = true,
      isApproved,
      rejectionReason,
      surveyNotes,
    } = body;

    if (!projectId || usableAreaSqFt === undefined || tiltAngleDeg === undefined || dcCableRunMtrs === undefined || acCableRunMtrs === undefined) {
      throw new ApiError(
        400,
        "BAD_REQUEST",
        "Project ID, usable area (sq ft), tilt angle, and DC/AC cable run lengths are mandatory."
      );
    }

    // Run survey submission and project status gate inside a transaction
    const survey = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: Number(projectId) },
      });

      if (!project) {
        throw new ApiError(404, "NOT_FOUND", "Project not found.");
      }

      // Upsert the SiteSurvey record
      const record = await tx.siteSurvey.upsert({
        where: { projectId: Number(projectId) },
        update: {
          surveyorId: user.id,
          roofType,
          usableAreaSqFt: Number(usableAreaSqFt),
          isSouthFacing: Boolean(isSouthFacing),
          tiltAngleDeg: Number(tiltAngleDeg),
          hasShadingIssue: Boolean(hasShadingIssue),
          parapetHeightFt: Number(parapetHeightFt),
          dcCableRunMtrs: Number(dcCableRunMtrs),
          acCableRunMtrs: Number(acCableRunMtrs),
          earthPitViable: Boolean(earthPitViable),
          isApproved: Boolean(isApproved),
          rejectionReason: isApproved ? null : rejectionReason || "Site did not pass feasibility check.",
          surveyNotes: surveyNotes || null,
        },
        create: {
          projectId: Number(projectId),
          surveyorId: user.id,
          roofType,
          usableAreaSqFt: Number(usableAreaSqFt),
          isSouthFacing: Boolean(isSouthFacing),
          tiltAngleDeg: Number(tiltAngleDeg),
          hasShadingIssue: Boolean(hasShadingIssue),
          parapetHeightFt: Number(parapetHeightFt),
          dcCableRunMtrs: Number(dcCableRunMtrs),
          acCableRunMtrs: Number(acCableRunMtrs),
          earthPitViable: Boolean(earthPitViable),
          isApproved: Boolean(isApproved),
          rejectionReason: isApproved ? null : rejectionReason || null,
          surveyNotes: surveyNotes || null,
        },
      });

      // State Gate: If approved, transition project to SURVEY_APPROVED
      if (isApproved) {
        await tx.project.update({
          where: { id: Number(projectId) },
          data: { status: ProjectStatus.SURVEY_APPROVED },
        });
      }

      return record;
    });

    return apiSuccess(survey, 201);
  } catch (error) {
    return handleApiError(error);
  }
}