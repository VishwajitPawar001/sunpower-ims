import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { handleApiError, ApiError } from "@/lib/errorHandler";

const JWT_SECRET = process.env.JWT_SECRET || "default-sunpower-secret-key-change-in-prod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      throw new ApiError(400, "BAD_REQUEST", "Email and password are required.");
    }

    // Look up staff member by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password.");
    }

    if (!user.isActive) {
      throw new ApiError(403, "FORBIDDEN", "This staff account has been deactivated. Contact Admin.");
    }

    // Verify bcrypt password hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new ApiError(401, "UNAUTHORIZED", "Invalid email or password.");
    }

    // Create signed token with employee role and code
    const token = jwt.sign(
      {
        id: user.id,
        employeeCode: user.employeeCode,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      JWT_SECRET,
      { expiresIn: "12h" }
    );

    // Build response with httpOnly cookie
    const response = NextResponse.json({
      success: true,
      data: {
        id: user.id,
        employeeCode: user.employeeCode,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}