import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteGenerateSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SALES"]);
    const body = await req.json();
    const valid = quoteGenerateSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: valid.projectId },
      include: { siteSurvey: true },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    const capacity = valid.capacityKw ? Number(valid.capacityKw) : Number(project.capacityKw);
    const systemType = valid.systemType || project.systemType;

    // Dynamic BOM calculations based on kW rating
    const panelCount = Math.ceil((capacity * 1000) / 550);
    const inverterRatingKw = capacity;
    const structureUnits = Math.ceil(panelCount / 2);

    // Retrieve active stock items to price the BOM
    const stockItems = await prisma.stockItem.findMany();

    const panelStock = stockItems.find((s) => s.category === "PANEL");
    const inverterStock = stockItems.find((s) => s.category === "INVERTER");
    const structureStock = stockItems.find((s) => s.category === "STRUCTURE");

    const panelUnitCost = panelStock ? Number(panelStock.unitCost) : 11500;
    const inverterUnitCost = inverterStock ? Number(inverterStock.unitCost) : 38000;
    const structureUnitCost = structureStock ? Number(structureStock.unitCost) : 1800;

    const totalPanelCost = panelCount * panelUnitCost;
    const totalInverterCost = inverterUnitCost;
    const totalStructureCost = structureUnits * structureUnitCost;
    const balanceCost = 15000;

    const totalBOMCost = totalPanelCost + totalInverterCost + totalStructureCost + balanceCost;

    let subsidyAmount = 0;
    if (systemType === "ON_GRID") {
      subsidyAmount = capacity <= 3 ? capacity * 18000 : 3 * 18000 + (capacity - 3) * 9000;
    }

    const marginMarkup = valid.marginMarkupPercent ?? 15;
    const grossPriceBeforeSubsidy = totalBOMCost * (1 + marginMarkup / 100);
    const calculatedNetPrice = Math.max(0, grossPriceBeforeSubsidy - subsidyAmount);

    const finalAgreedPrice = valid.agreedPrice ? Number(valid.agreedPrice) : calculatedNetPrice;

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "QUOTE_ISSUED",
        capacityKw: capacity,
        systemType: systemType,
        agreedPrice: finalAgreedPrice,
      },
    });

    return apiSuccess({
      quoteId: updatedProject.id,
      projectStatus: "QUOTE_ISSUED",
      project: updatedProject,
      quote: {
        capacityKw: capacity,
        systemType: updatedProject.systemType,
        bomItems: [
          { item: "550W Mono PERC Solar Panels", quantity: panelCount, cost: totalPanelCost },
          { item: `${inverterRatingKw}kW Solar Inverter`, quantity: 1, cost: totalInverterCost },
          { item: "Mounting Aluminum Structures (Pairs)", quantity: structureUnits, cost: totalStructureCost },
          { item: "Balance of System (Cables, Earthing, MC4, Isolators)", quantity: 1, cost: balanceCost },
        ],
        totalBOMCost,
        subsidyAmount,
        grossPriceBeforeSubsidy,
        netPayablePrice: finalAgreedPrice,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
