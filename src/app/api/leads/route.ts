import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerLeadSchema } from "@/lib/validations";
import { handleApiError, apiSuccess } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "SALES"]);
    const body = await req.json();
    const validData = customerLeadSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          fullName: validData.fullName,
          phone: validData.phone,
          email: validData.email || null,
          installationAddress: validData.installationAddress,
        },
      });

      const projectCode = `SP-${Date.now().toString().slice(-6)}`;

      const project = await tx.project.create({
        data: {
          projectCode,
          customerId: customer.id,
          capacityKw: validData.capacityKw,
          systemType: validData.systemType,
          status: "LEAD_RECEIVED",
        },
      });

      return { customer, project };
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "SALES", "SURVEYOR"]);
    const projects = await prisma.project.findMany({
      include: {
        customer: true,
        siteSurvey: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(projects);
  } catch (error) {
    return handleApiError(error);
  }
}