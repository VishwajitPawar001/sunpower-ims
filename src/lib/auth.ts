import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "sunpower-super-secret-jwt-key-2026-production";

export type AllowedRole =
  | "ADMIN"
  | "DIRECTOR"
  | "SALES"
  | "SURVEYOR"
  | "WAREHOUSE"
  | "TECHNICIAN"
  | "SUPPORT";

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
  let token: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    token = req.cookies.get("auth-token")?.value || null;
  }

  if (!token) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid authorization token.");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UserSession;

    const isPrivileged = decoded.role === "ADMIN" || decoded.role === "DIRECTOR";
    if (!allowedRoles.includes(decoded.role) && !isPrivileged) {
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
