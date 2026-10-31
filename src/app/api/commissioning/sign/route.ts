import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { ComponentCategory, ProjectStatus, SerialStatus, UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = requireRole(req, [UserRole.LEAD_TECHNICIAN, UserRole.ADMIN, UserRole.DIRECTOR]);

    const body = await req.json();
    const {
      projectId,
      civilPadsCompleted = true,
      groutCuringVerified = true,
      structureTorqued = true,
      dcConduitCompleted = true,
      earthPitsCompleted = true,
      vocVolts,
      iscAmperes,
      earthResistanceOhms,
      customerSignatureSvg,
      roofPhotoUrl,
    } = body;

    if (!projectId || vocVolts === undefined || iscAmperes === undefined || earthResistanceOhms === undefined || !customerSignatureSvg) {
      throw new ApiError(
        400,
        "BAD_REQUEST",
        "projectId, vocVolts, iscAmperes, earthResistanceOhms, and customerSignatureSvg are required."
      );
    }

    const voc = Number(vocVolts);
    const isc = Number(iscAmperes);
    const earthResistance = Number(earthResistanceOhms);

    // Mandatory Electrical Safety Gate Checks
    if (voc <= 0 || isc <= 0) {
      throw new ApiError(400, "SAFETY_VIOLATION", "Array open circuit voltage (Voc) and current (Isc) must be positive values.");
    }

    if (earthResistance >= 5.0) {
      throw new ApiError(
        400,
        "SAFETY_VIOLATION",
        `Earth resistance must be strictly below 5.0 Ohms for electrical compliance. Measured: ${earthResistance} Ohms.`
      );
    }

    // Atomically execute commissioning sign-off and warranty clock start
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findUnique({
        where: { id: Number(projectId) },
        include: {
          dispatchedSerials: { include: { stockItem: true } },
          customer: true,
        },
      });

      if (!project) {
        throw new ApiError(404, "NOT_FOUND", "Project not found.");
      }

      // Record field checklist and pre-power test readings
      const installRecord = await tx.installationRecord.upsert({
        where: { projectId: project.id },
        update: {
          leadTechnicianId: user.id,
          civilPadsCompleted: Boolean(civilPadsCompleted),
          groutCuringVerified: Boolean(groutCuringVerified),
          structureTorqued: Boolean(structureTorqued),
          dcConduitCompleted: Boolean(dcConduitCompleted),
          earthPitsCompleted: Boolean(earthPitsCompleted),
          vocVolts: voc,
          iscAmperes: isc,
          earthResistanceOhms: earthResistance,
          roofPhotoUrl: roofPhotoUrl || null,
          customerSignatureSvg: String(customerSignatureSvg),
          installedAt: new Date(),
        },
        create: {
          projectId: project.id,
          leadTechnicianId: user.id,
          civilPadsCompleted: Boolean(civilPadsCompleted),
          groutCuringVerified: Boolean(groutCuringVerified),
          structureTorqued: Boolean(structureTorqued),
          dcConduitCompleted: Boolean(dcConduitCompleted),
          earthPitsCompleted: Boolean(earthPitsCompleted),
          vocVolts: voc,
          iscAmperes: isc,
          earthResistanceOhms: earthResistance,
          roofPhotoUrl: roofPhotoUrl || null,
          customerSignatureSvg: String(customerSignatureSvg),
          installedAt: new Date(),
        },
      });

      // Advance project status to COMMISSIONED
      const updatedProject = await tx.project.update({
        where: { id: project.id },
        data: { status: ProjectStatus.COMMISSIONED },
        include: { customer: true, packageTemplate: true },
      });

      // Automatically start warranty clocks for all bound hardware serials
      const now = new Date();
      for (const serial of project.dispatchedSerials) {
        let warrantyMonths = serial.stockItem?.warrantyMonths || 24;

        // If panel, ensure minimum 20 years (240 months); inverter/battery 2 years (24 months)
        if (serial.stockItem.category === ComponentCategory.PANEL) {
          warrantyMonths = 240;
        } else if (
          serial.stockItem.category === ComponentCategory.INVERTER ||
          serial.stockItem.category === ComponentCategory.BATTERY
        ) {
          warrantyMonths = 24;
        }

        const endDate = new Date(now);
        endDate.setMonth(endDate.getMonth() + warrantyMonths);

        await tx.serialRegistry.update({
          where: { id: serial.id },
          data: {
            status: SerialStatus.INSTALLED,
            warrantyEndDate: endDate,
          },
        });
      }

      return { updatedProject, installRecord };
    });

    return apiSuccess({
      message: `System successfully commissioned and warranty clocks started for ${result.updatedProject.projectCode}.`,
      project: result.updatedProject,
      installationRecord: result.installRecord,
    });
  } catch (error) {
    return handleApiError(error);
  }
}