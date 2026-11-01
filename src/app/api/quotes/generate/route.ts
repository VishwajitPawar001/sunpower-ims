import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { ProjectStatus, UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, [UserRole.SALES, UserRole.ADMIN, UserRole.DIRECTOR]);

    const body = await req.json();
    const { projectId, packageTemplateId, customQuotedPrice } = body;

    if (!projectId || !packageTemplateId) {
      throw new ApiError(400, "BAD_REQUEST", "projectId and packageTemplateId are required.");
    }

    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      include: { siteSurvey: true, customer: true },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    // Workflow Gate Check: Survey must be approved before quote issuance
    if (!project.siteSurvey || !project.siteSurvey.isApproved) {
      throw new ApiError(
        400,
        "WORKFLOW_VIOLATION",
        "Cannot generate quote: Site survey must be completed and marked 'Approved' first."
      );
    }

    const pkg = await prisma.packageTemplate.findUnique({
      where: { id: Number(packageTemplateId) },
    });

    if (!pkg) {
      throw new ApiError(404, "NOT_FOUND", "Package template not found.");
    }

    const finalPrice = customQuotedPrice ? Number(customQuotedPrice) : Number(pkg.defaultPrice);

    // Derived Direct Job Execution Costs
    const freightCost = 2000.0;
    const civilMaterialCost = 2500.0;
    const directLaborCost = Number(pkg.baseLaborCost);
    const totalCompanyCost = Number(pkg.baseHardwareCost) + freightCost + civilMaterialCost + directLaborCost;
    const projectedGrossMargin = finalPrice - totalCompanyCost;

    // Derived Payment Milestones
    const milestone1Advance20 = Math.round(finalPrice * 0.2);
    const milestone2Dispatch70 = Math.round(finalPrice * 0.7);
    const milestone3Balance10 = finalPrice - milestone1Advance20 - milestone2Dispatch70;

    // Atomically update project pricing and package binding
    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        packageTemplateId: pkg.id,
        systemCapacityKw: pkg.capacityKw,
        systemType: pkg.systemType,
        totalQuotedPrice: finalPrice,
        freightCost,
        civilMaterialCost,
        directLaborCost,
      },
      include: {
        packageTemplate: true,
        customer: true,
      },
    });

    return apiSuccess({
      quoteId: updatedProject.id,
      projectStatus: "QUOTE_ISSUED",
      project: updatedProject,
      quotationBreakdown: {
        packageCode: pkg.packageCode,
        packageName: pkg.name,
        systemType: pkg.systemType,
        capacityKw: Number(pkg.capacityKw),
        panelCount: pkg.panelCount,
        inverterRatingKw: Number(pkg.inverterRatingKw),
        batteryCapacityAh: pkg.batteryCapacityAh,
        totalTurnkeyPrice: finalPrice,
        milestones: {
          milestone1BookingAdvance20: milestone1Advance20,
          milestone2PreDispatch70: milestone2Dispatch70,
          milestone3FinalGridSync10: milestone3Balance10,
        },
        internalCostSheet: {
          baseHardwareCost: Number(pkg.baseHardwareCost),
          freightCost,
          civilMaterialCost,
          directLaborCost,
          totalDirectCost: totalCompanyCost,
          projectedGrossMargin,
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
