import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler";
import type { UserRole } from "@/types/solar";

const JWT_SECRET =
  process.env.JWT_SECRET || "default-sunpower-secret-key-change-in-prod";

export type AllowedRole = UserRole | "TECHNICIAN";

export interface UserSession {
  id: number;
  userId: string;
  email: string;
  role: AllowedRole;
  fullName: string;
  employeeCode?: string;
}

export function signJwtToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function requireRole(
  req: NextRequest,
  allowedRoles: AllowedRole[]
): UserSession {
  // Support both Bearer tokens and the login HTTP-only cookie.
  const authHeader = req.headers.get("authorization");

  const token =
    authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.cookies.get("auth-token")?.value;

  if (!token) {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Missing or invalid authorization token."
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;

    if (!allowedRoles.includes(decoded.role) && decoded.role !== "ADMIN") {
      throw new ApiError(
        403,
        "FORBIDDEN",
        `Access denied. Role '${decoded.role}' lacks permission for this resource.`
      );
    }

    return decoded;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Session expired or invalid token."
    );
  }
}