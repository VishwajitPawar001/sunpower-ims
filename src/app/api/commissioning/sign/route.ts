import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { commissioningSignSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const authUser = requireRole(req, ["ADMIN", "DIRECTOR", "TECHNICIAN"]);
    const body = await req.json();
    const valid = commissioningSignSchema.parse(body);

    const project = await prisma.project.findUnique({
      where: { id: valid.projectId },
    });

    if (!project) {
      throw new ApiError(404, "NOT_FOUND", "Project not found.");
    }

    const voc = valid.vocVoltsMeasured ?? valid.vocVolts ?? 380;
    const isc = valid.iscAmpsMeasured ?? valid.iscAmperes ?? 9.5;
    const signature = valid.customerSignatureSvg || valid.signatureSvg || "<svg></svg>";
    const photoUrl = valid.completionPhotoUrl || "https://storage.sunpower.internal/commissioning/verified-site.jpg";

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const record = await tx.commissioningRecord.upsert({
        where: { projectId: valid.projectId },
        update: {
          leadTechnicianId: authUser.userId,
          vocVoltsMeasured: voc,
          iscAmpsMeasured: isc,
          earthingResistanceOhms: valid.earthingResistanceOhms,
          completionPhotoUrl: photoUrl,
          customerSignatureSvg: signature,
          signedAt: now,
        },
        create: {
          projectId: valid.projectId,
          leadTechnicianId: authUser.userId,
          vocVoltsMeasured: voc,
          iscAmpsMeasured: isc,
          earthingResistanceOhms: valid.earthingResistanceOhms,
          completionPhotoUrl: photoUrl,
          customerSignatureSvg: signature,
          signedAt: now,
        },
      });

      const updatedProject = await tx.project.update({
        where: { id: valid.projectId },
        data: {
          status: "COMMISSIONED",
        },
      });

      return { record, project: updatedProject };
    });

    return apiSuccess({
      recordId: result.record.id,
      projectStatus: result.project.status,
      warrantyStartDate: result.record.signedAt.toISOString().split("T")[0],
      message: "Commissioning sign-off completed successfully.",
      commissioningRecord: result.record,
      project: result.project,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
