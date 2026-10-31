import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerLeadSchema } from "@/lib/validations";
import { handleApiError, apiSuccess } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SALES"]);
    const body = await req.json();
    const validData = customerLeadSchema.parse(body);

    const fullName = (validData.fullName || validData.customerName || "Solar Client").trim();
    const address = (validData.installationAddress || validData.address || "Installation Site").trim();

    const result = await prisma.$transaction(async (tx) => {
      let customer = await tx.customer.findUnique({
        where: { phone: validData.phone },
      });

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            fullName,
            phone: validData.phone,
            email: validData.email || null,
            installationAddress: address,
          },
        });
      } else {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            fullName,
            installationAddress: address,
            ...(validData.email ? { email: validData.email } : {}),
          },
        });
      }

      const count = await tx.project.count();
      const projectCode = `PRJ-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

      const project = await tx.project.create({
        data: {
          projectCode,
          customerId: customer.id,
          capacityKw: validData.capacityKw,
          systemType: validData.systemType,
          status: "LEAD_RECEIVED",
          agreedPrice: null,
        },
        include: {
          customer: true,
        },
      });

      return {
        id: project.id,
        projectCode: project.projectCode,
        customerName: customer.fullName,
        phone: customer.phone,
        address: customer.installationAddress,
        capacityKw: Number(project.capacityKw),
        systemType: project.systemType,
        status: project.status,
        agreedPrice: 0,
        createdAt: project.createdAt.toISOString().split("T")[0],
      };
    });

    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN", "DIRECTOR", "SALES", "SURVEYOR", "WAREHOUSE", "TECHNICIAN", "SUPPORT"]);
    const projects = await prisma.project.findMany({
      include: {
        customer: true,
        siteSurvey: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const mappedLeads = projects.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      customerName: p.customer.fullName,
      phone: p.customer.phone,
      address: p.customer.installationAddress,
      capacityKw: Number(p.capacityKw),
      systemType: p.systemType,
      status: p.status,
      agreedPrice: p.agreedPrice ? Number(p.agreedPrice) : 0,
      createdAt: p.createdAt.toISOString().split("T")[0],
      siteSurvey: p.siteSurvey,
    }));

    return apiSuccess(mappedLeads);
  } catch (error) {
    return handleApiError(error);
  }
}
