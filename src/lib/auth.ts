import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-min-32-chars-long";

export type AllowedRole = "ADMIN" | "SALES" | "SURVEYOR" | "WAREHOUSE" | "TECHNICIAN" | "SUPPORT";

export interface UserSession {
  userId: string;
  email: string;
  role: AllowedRole;
  fullName: string;
}

export function signJwtToken(payload: UserSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function requireRole(req: NextRequest, allowedRoles: AllowedRole[]): UserSession {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid authorization token.");
  }

  const token = authHeader.split(" ")[1];
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
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "UNAUTHORIZED", "Session expired or invalid token.");
  }
}