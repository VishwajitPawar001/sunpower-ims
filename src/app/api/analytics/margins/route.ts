import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "SALES"]);

    // 1. Fetch completed or agreed projects
    const projects = await prisma.project.findMany({
      include: {
        siteSurvey: true,
        commissioningRecord: true,
      },
    });

    // 2. Fetch stock catalog to calculate benchmark costs
    const stockItems = await prisma.stockItem.findMany();
    const panelUnitCost = Number(stockItems.find((s) => s.category === "PANEL")?.unitCost ?? 8500);
    const inverterUnitCost = Number(stockItems.find((s) => s.category === "INVERTER")?.unitCost ?? 32000);
    const structureUnitCost = Number(stockItems.find((s) => s.category === "STRUCTURE")?.unitCost ?? 2500);
    const balanceCost = 15000;

    let totalRevenue = 0;
    let totalEstimatedBOMCost = 0;
    let totalSubsidyDisbursed = 0;

    const pipelineCounts: Record<string, number> = {
      LEAD_RECEIVED: 0,
      SURVEY_APPROVED: 0,
      QUOTE_ISSUED: 0,
      ORDER_CONFIRMED: 0,
      DISPATCHED: 0,
      COMMISSIONED: 0,
    };

    const capacityDistribution: Record<string, number> = {};

    for (const project of projects) {
      // Pipeline stage counters
      if (pipelineCounts[project.status] !== undefined) {
        pipelineCounts[project.status]++;
      }

      const cap = Number(project.capacityKw);
      const capKey = `${cap}kW`;
      capacityDistribution[capKey] = (capacityDistribution[capKey] || 0) + 1;

      // Calculate hardware cost based on capacity
      const panelCount = Math.ceil((cap * 1000) / 550);
      const structureUnits = Math.ceil(panelCount / 2);
      const projectBOM = panelCount * panelUnitCost + inverterUnitCost + structureUnits * structureUnitCost + balanceCost;

      totalEstimatedBOMCost += projectBOM;

      if (project.agreedPrice) {
        totalRevenue += Number(project.agreedPrice);
      }

      if (project.systemType === "ON_GRID") {
        const sub = cap <= 3 ? cap * 18000 : 3 * 18000 + (cap - 3) * 9000;
        totalSubsidyDisbursed += sub;
      }
    }

    const grossProfit = totalRevenue - totalEstimatedBOMCost;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return apiSuccess({
      metrics: {
        totalProjects: projects.length,
        totalRevenue,
        totalEstimatedBOMCost,
        grossProfit,
        grossMarginPercent: Number(grossMarginPercent.toFixed(2)),
        totalSubsidyDisbursed,
      },
      pipelineCounts,
      capacityDistribution,
    });
  } catch (error) {
    return handleApiError(error);
  }
}