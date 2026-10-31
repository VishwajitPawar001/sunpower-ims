import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { ProjectStatus, UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, [UserRole.SALES, UserRole.ADMIN, UserRole.DIRECTOR]);

    const body = await req.json();
    const { projectId, paymentAmount, milestoneType } = body;

    if (!projectId || paymentAmount === undefined || !milestoneType) {
      throw new ApiError(
        400,
        "BAD_REQUEST",
        "projectId, paymentAmount, and milestoneType ('BOOKING_20' or 'PRE_DISPATCH_70') are required."
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: { customer: true, packageTemplate: true },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    const amountPaid = Number(paymentAmount);
    if (amountPaid <= 0) {
      throw new ApiError(400, "BAD_REQUEST", "Payment amount must be greater than zero.");
    }

    let nextStatus: ProjectStatus = project.status;
    let updateData: Record<string, unknown> = {};

    if (milestoneType === "BOOKING_20") {
      // Must have had quote generated/approved survey
      if (project.status !== ProjectStatus.SURVEY_APPROVED && project.status !== ProjectStatus.LEAD_RECEIVED) {
        throw new ApiError(
          400,
          "INVALID_TRANSITION",
          `Cannot accept booking advance for project currently in status: ${project.status}`
        );
      }

      nextStatus = ProjectStatus.QUOTE_ACCEPTED;
      updateData = {
        bookingAdvancePaid: { increment: amountPaid },
        status: nextStatus,
      };
    } else if (milestoneType === "PRE_DISPATCH_70") {
      // Must be at least QUOTE_ACCEPTED
      if (project.status !== ProjectStatus.QUOTE_ACCEPTED && project.status !== ProjectStatus.DISPATCH_PENDING) {
        throw new ApiError(
          400,
          "INVALID_TRANSITION",
          `Cannot process pre-dispatch payment: Project must be in QUOTE_ACCEPTED status first.`
        );
      }

      // Check if total payments reach the 70% requirement
      const totalQuoted = Number(project.totalQuotedPrice);
      const updatedDispatchPaid = Number(project.dispatchPaymentPaid) + amountPaid;
      const combinedPaid = Number(project.bookingAdvancePaid) + updatedDispatchPaid;
      const seventyPercentThreshold = totalQuoted * 0.7;

      if (combinedPaid >= seventyPercentThreshold) {
        nextStatus = ProjectStatus.DISPATCH_PENDING;
      }

      updateData = {
        dispatchPaymentPaid: { increment: amountPaid },
        status: nextStatus,
      };
    } else {
      throw new ApiError(400, "BAD_REQUEST", "Invalid milestoneType. Allowed: 'BOOKING_20', 'PRE_DISPATCH_70'.");
    }

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: updateData,
      include: { customer: true, packageTemplate: true },
    });

    return apiSuccess({
      message: `Payment of ₹${amountPaid.toLocaleString()} recorded successfully under ${milestoneType}.`,
      project: updatedProject,
    });
  } catch (error) {
    return handleApiError(error);
  }
}