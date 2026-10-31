import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { handleApiError, ApiError } from "@/lib/errorHandler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default-sunpower-secret-key-change-in-prod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const valid = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: valid.email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid credentials or inactive account.");
    }

    const isMatch = await bcrypt.compare(valid.password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid credentials.");
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
          },
          token,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie for browser session handling
    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}