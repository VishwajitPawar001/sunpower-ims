import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteGenerateSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "SALES"]);
    const body = await req.json();
    const valid = quoteGenerateSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: valid.projectId },
      include: { siteSurvey: true },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    if (project.status !== "SURVEY_APPROVED") {
      throw new ApiError(
        400,
        "INVALID_STATE_TRANSITION",
        `Cannot issue a quote. Project is in '${project.status}' state, expected 'SURVEY_APPROVED'.`
      );
    }

    const capacity = Number(project.capacityKw);

    // Dynamic BOM calculations based on kW rating
    // 550W panels per kW: ~2 panels per kW
    const panelCount = Math.ceil((capacity * 1000) / 550);
    const inverterRatingKw = capacity;
    const structureUnits = Math.ceil(panelCount / 2);

    // Retrieve active stock items to price the BOM
    const stockItems = await prisma.stockItem.findMany();

    const panelStock = stockItems.find((s) => s.category === "PANEL");
    const inverterStock = stockItems.find((s) => s.category === "INVERTER");
    const structureStock = stockItems.find((s) => s.category === "STRUCTURE");

    const panelUnitCost = panelStock ? Number(panelStock.unitCost) : 8500;
    const inverterUnitCost = inverterStock ? Number(inverterStock.unitCost) : 32000;
    const structureUnitCost = structureStock ? Number(structureStock.unitCost) : 2500;

    const totalPanelCost = panelCount * panelUnitCost;
    const totalInverterCost = inverterUnitCost;
    const totalStructureCost = structureUnits * structureUnitCost;
    const balanceCost = 15000; // Cables, earthing, isolators, net metering kit

    const totalBOMCost = totalPanelCost + totalInverterCost + totalStructureCost + balanceCost;

    // Subsidy structure (standard residential solar subsidy tier)
    let subsidyAmount = 0;
    if (project.systemType === "ON_GRID") {
      subsidyAmount = capacity <= 3 ? capacity * 18000 : 3 * 18000 + (capacity - 3) * 9000;
    }

    // Apply gross margin
    const grossPriceBeforeSubsidy = totalBOMCost * (1 + valid.marginMarkupPercent / 100);
    const netPayablePrice = Math.max(0, grossPriceBeforeSubsidy - subsidyAmount);

    const updatedProject = await prisma.project.update({
      where: { id: project.id },
      data: {
        status: "QUOTE_ISSUED",
        agreedPrice: netPayablePrice,
      },
    });

    return apiSuccess({
      project: updatedProject,
      quote: {
        capacityKw: capacity,
        systemType: project.systemType,
        bomItems: [
          { item: "550W Mono PERC Solar Panels", quantity: panelCount, cost: totalPanelCost },
          { item: `${inverterRatingKw}kW Solar Inverter`, quantity: 1, cost: totalInverterCost },
          { item: "Mounting Aluminum Structures (Pairs)", quantity: structureUnits, cost: totalStructureCost },
          { item: "Balance of System (Cables, Earthing, MC4, Isolators)", quantity: 1, cost: balanceCost },
        ],
        totalBOMCost,
        subsidyAmount,
        grossPriceBeforeSubsidy,
        netPayablePrice,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}