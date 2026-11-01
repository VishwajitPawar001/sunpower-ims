import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess } from "@/lib/errorHandler";
import { ProjectStatus, TicketStatus, UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    requireRole(req, [UserRole.DIRECTOR, UserRole.ADMIN]);

    // 1. Fetch all projects with customers, packages, and dispatched components
    const projects = await prisma.project.findMany({
      include: {
        customer: true,
        packageTemplate: true,
        dispatchedSerials: {
          include: { stockItem: true },
        },
        installationRecord: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch all staff to calculate fixed monthly payroll overhead
    const staffMembers = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        role: true,
        monthlySalary: true,
      },
    });

    const totalMonthlyPayroll = staffMembers.reduce(
      (sum, emp) => sum + Number(emp.monthlySalary),
      0
    );

    // 3. Fetch open support tickets and pending RMA issues
    const openTicketsCount = await prisma.supportTicket.count({
      where: {
        status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] },
      },
    });

    // 4. Calculate P&L and Margin per Project
    let totalRevenueQuoted = 0;
    let totalCollectedSoFar = 0;
    let totalDirectCostBOM = 0;
    let totalFreightAndCivil = 0;
    let totalDirectLabor = 0;

    const projectFinancials = projects.map((prj) => {
      const quoted = Number(prj.totalQuotedPrice);
      const bookingAdvance = Number(prj.bookingAdvancePaid);
      const dispatchPayment = Number(prj.dispatchPaymentPaid);
      const finalBalance = Number(prj.finalBalancePaid);
      const collected = bookingAdvance + dispatchPayment + finalBalance;
      const outstandingReceivable = quoted - collected;

      // Base hardware cost: sum of scanned serial unit costs or default package cost
      let hardwareCost = 0;
      if (prj.dispatchedSerials && prj.dispatchedSerials.length > 0) {
        hardwareCost = prj.dispatchedSerials.reduce(
          (sum, s) => sum + Number(s.stockItem?.unitCost || 0),
          0
        );
      } else if (prj.packageTemplate) {
        hardwareCost = Number(prj.packageTemplate.baseHardwareCost);
      }

      const freight = Number(prj.freightCost);
      const civil = Number(prj.civilMaterialCost);
      const labor = Number(prj.directLaborCost);

      const totalJobCost = hardwareCost + freight + civil + labor;
      const grossMargin = quoted - totalJobCost;
      const marginPercentage = quoted > 0 ? (grossMargin / quoted) * 100 : 0;

      // Aggregate global pipeline metrics
      totalRevenueQuoted += quoted;
      totalCollectedSoFar += collected;
      totalDirectCostBOM += hardwareCost;
      totalFreightAndCivil += freight + civil;
      totalDirectLabor += labor;

      return {
        id: prj.id,
        projectCode: prj.projectCode,
        customerName: prj.customer.fullName,
        phone: prj.customer.phone,
        status: prj.status,
        systemType: prj.systemType,
        capacityKw: Number(prj.systemCapacityKw),
        totalQuotedPrice: quoted,
        collectedAmount: collected,
        outstandingReceivable,
        costBreakdown: {
          hardwareCost,
          freightCost: freight,
          civilMaterialCost: civil,
          directLaborCost: labor,
          totalJobCost,
        },
        grossMargin,
        marginPercentage: Number(marginPercentage.toFixed(2)),
        isProfitable: grossMargin > 0,
      };
    });

    const totalExecutionCosts = totalDirectCostBOM + totalFreightAndCivil + totalDirectLabor;
    const netOperatingProfit = totalRevenueQuoted - totalExecutionCosts;

    return apiSuccess({
      monthEndExecutiveSummary: {
        totalRevenueQuoted,
        totalCollectedSoFar,
        totalOutstandingReceivables: totalRevenueQuoted - totalCollectedSoFar,
        totalExecutionCosts,
        netOperatingProfit,
        fixedMonthlyPayrollOverhead: totalMonthlyPayroll,
        activeStaffCount: staffMembers.length,
        openServiceTicketsCount: openTicketsCount,
        totalProjectsInPipeline: projects.length,
      },
      projectFinancials,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
