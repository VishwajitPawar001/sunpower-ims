
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserSchema } from "@/lib/validations";
import {
  handleApiError,
  apiSuccess,
  ApiError,
} from "@/lib/errorHandler";
import { requireRole } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN"]);

    const body = await req.json();
    const valid = createUserSchema.parse(body);

    const normalizedEmail = valid.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ApiError(
        409,
        "TRANSACTION_CONFLICT",
        `User with email '${normalizedEmail}' already exists.`
      );
    }

    const passwordHash = await bcrypt.hash(valid.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: valid.fullName.trim(),
        role: valid.role,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return apiSuccess({ user: newUser }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    requireRole(req, ["ADMIN"]);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(
      {
        count: users.length,
        users,
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
