import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, apiSuccess } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SALES"]);

    // 1. Fetch all projects with customers and surveys
    const projects = await prisma.project.findMany({
      include: {
        customer: true,
        siteSurvey: true,
        commissioningRecord: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch stock catalog to calculate benchmark costs
    const stockItems = await prisma.stockItem.findMany();
    const panelUnitCost = Number(stockItems.find((s) => s.category === "PANEL")?.unitCost ?? 11500);
    const inverterUnitCost = Number(stockItems.find((s) => s.category === "INVERTER")?.unitCost ?? 38000);
    const structureUnitCost = Number(stockItems.find((s) => s.category === "STRUCTURE")?.unitCost ?? 1800);
    const balanceCost = 15000;

    let totalRevenue = 0;
    let totalEstimatedBOMCost = 0;
    let totalLaborCost = 0;
    let totalOverheadCost = 0;

    const pipelineDistribution = {
      leadReceived: 0,
      surveyPending: 0,
      surveyApproved: 0,
      quoteIssued: 0,
      orderConfirmed: 0,
      dispatched: 0,
      commissioned: 0,
      completed: 0,
      rejected: 0,
    };

    const auditedProjects = [];

    for (const project of projects) {
      // Map project status to distribution key
      switch (project.status) {
        case "LEAD_RECEIVED":
          pipelineDistribution.leadReceived++;
          break;
        case "SURVEY_PENDING":
          pipelineDistribution.surveyPending++;
          break;
        case "SURVEY_APPROVED":
          pipelineDistribution.surveyApproved++;
          break;
        case "QUOTE_ISSUED":
          pipelineDistribution.quoteIssued++;
          break;
        case "ORDER_CONFIRMED":
          pipelineDistribution.orderConfirmed++;
          break;
        case "DISPATCHED":
          pipelineDistribution.dispatched++;
          break;
        case "COMMISSIONED":
          pipelineDistribution.commissioned++;
          break;
        case "COMPLETED":
          pipelineDistribution.completed++;
          break;
        case "REJECTED":
          pipelineDistribution.rejected++;
          break;
      }

      const cap = Number(project.capacityKw);
      const panelCount = Math.ceil((cap * 1000) / 550);
      const structureUnits = Math.ceil(panelCount / 2);
      const projectBOM = panelCount * panelUnitCost + inverterUnitCost + structureUnits * structureUnitCost + balanceCost;
      const labor = Math.round(cap * 5500);
      const overhead = Math.round(projectBOM * 0.08);

      const invoice = project.agreedPrice
        ? Number(project.agreedPrice)
        : Math.round((projectBOM + labor + overhead) / (1 - 0.28));

      const totalProjectCost = projectBOM + labor + overhead;
      const profit = invoice - totalProjectCost;
      const marginPct = invoice > 0 ? (profit / invoice) * 100 : 0;

      totalRevenue += invoice;
      totalEstimatedBOMCost += projectBOM;
      totalLaborCost += labor;
      totalOverheadCost += overhead;

      auditedProjects.push({
        code: project.projectCode,
        customer: project.customer.fullName,
        capacity: `${cap.toFixed(1)} kW`,
        invoice: Math.round(invoice),
        bom: Math.round(projectBOM),
        labor: Math.round(labor),
        overhead: Math.round(overhead),
        profit: Math.round(profit),
        marginPct: Number(marginPct.toFixed(1)),
        status: project.status,
      });
    }

    const netProfitTotal = totalRevenue - (totalEstimatedBOMCost + totalLaborCost + totalOverheadCost);
    const grossMarginPercent = totalRevenue > 0
      ? Number(((netProfitTotal / totalRevenue) * 100).toFixed(1))
      : 28.3;

    return apiSuccess({
      totalRevenue,
      totalEstimatedBOMCost,
      totalLaborCost,
      totalOverheadCost,
      grossMarginPercent,
      pipelineDistribution,
      projects: auditedProjects,
      metrics: {
        totalProjects: projects.length,
        totalRevenue,
        totalEstimatedBOMCost,
        totalLaborCost,
        totalOverheadCost,
        grossProfit: netProfitTotal,
        grossMarginPercent,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
