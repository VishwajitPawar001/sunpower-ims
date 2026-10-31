import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { handleApiError, apiSuccess, ApiError } from "@/lib/errorHandler";
import { signJwtToken, AllowedRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or credentials.");
    }

    const isMatch = await bcrypt.compare(validated.password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or credentials.");
    }

    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      role: user.role as AllowedRole,
      fullName: user.fullName,
    });

    return apiSuccess({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}