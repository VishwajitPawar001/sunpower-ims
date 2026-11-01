import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { ProjectStatus, SystemType, UserRole } from "@prisma/client";

// GET /api/leads - Retrieve pipeline leads with customer details
export async function GET(req: NextRequest) {
  try {
    requireRole(req, [UserRole.SALES, UserRole.ADMIN, UserRole.DIRECTOR, UserRole.SURVEYOR]);

    const leads = await prisma.project.findMany({
      include: {
        customer: true,
        packageTemplate: true,
        siteSurvey: {
          include: {
            surveyor: {
              select: { fullName: true, employeeCode: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(leads);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/leads - Create or attach lead with phone deduplication
export async function POST(req: NextRequest) {
  try {
    requireRole(req, [UserRole.SALES, UserRole.ADMIN, UserRole.DIRECTOR]);

    const body = await req.json();
    const {
      fullName,
      phone,
      email,
      installationAddress,
      city,
      state,
      pincode,
      systemCapacityKw,
      systemType = SystemType.ON_GRID,
      consumerAccountNumber,
      sanctionedLoadKw,
      monthlyPowerBill,
      packageTemplateId,
    } = body;

    if (!fullName || !phone || !installationAddress || !systemCapacityKw) {
      throw new ApiError(400, "BAD_REQUEST", "Full name, phone, installation address, and capacity (kW) are required.");
    }

    const cleanPhone = String(phone).replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      throw new ApiError(400, "BAD_REQUEST", "Valid 10-digit phone number is required.");
    }

    // Run atomically inside a transaction
    const newProject = await prisma.$transaction(async (tx) => {
      // 1. Phone Deduplication Check
      let customer = await tx.customer.findUnique({
        where: { phone: cleanPhone },
      });

      if (!customer) {
        // Generate sequential CUST-#####
        const customerCount = await tx.customer.count();
        const nextCustomerNum = String(customerCount + 1).padStart(5, "0");
        const customerCode = `CUST-${nextCustomerNum}`;

        customer = await tx.customer.create({
          data: {
            customerCode,
            fullName: fullName.trim(),
            phone: cleanPhone,
            email: email ? email.trim() : null,
            installationAddress: installationAddress.trim(),
            city: city ? city.trim() : "Pune",
            state: state ? state.trim() : "Maharashtra",
            pincode: pincode ? String(pincode).trim() : "411001",
          },
        });
      }

      // 2. Generate sequential PRJ-YYYY-#####
      const currentYear = new Date().getFullYear();
      const projectCount = await tx.project.count();
      const nextProjectNum = String(projectCount + 1).padStart(5, "0");
      const projectCode = `PRJ-${currentYear}-${nextProjectNum}`;

      // 3. Resolve default package pricing if selected
      let totalQuotedPrice = 0;
      if (packageTemplateId) {
        const pkg = await tx.packageTemplate.findUnique({
          where: { id: Number(packageTemplateId) },
        });
        if (pkg) {
          totalQuotedPrice = Number(pkg.defaultPrice);
        }
      }

      // 4. Create Project record
      return await tx.project.create({
        data: {
          projectCode,
          customerId: customer.id,
          packageTemplateId: packageTemplateId ? Number(packageTemplateId) : null,
          systemCapacityKw: Number(systemCapacityKw),
          systemType,
          status: ProjectStatus.LEAD_RECEIVED,
          consumerAccountNumber: consumerAccountNumber || null,
          sanctionedLoadKw: sanctionedLoadKw ? Number(sanctionedLoadKw) : null,
          monthlyPowerBill: monthlyPowerBill ? Number(monthlyPowerBill) : null,
          totalQuotedPrice,
        },
        include: {
          customer: true,
          packageTemplate: true,
        },
      });
    });

    return apiSuccess(newProject, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
