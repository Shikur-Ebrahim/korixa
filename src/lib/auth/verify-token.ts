import { getAdminAuth } from "@/lib/firebase-admin-auth";
import type { DecodedIdToken } from "firebase-admin/auth";

export async function verifyAuthToken(request: Request): Promise<DecodedIdToken> {
  const header = request.headers.get("Authorization");

  if (!header?.startsWith("Bearer ")) {
    throw new AuthError("Missing authorization token.", 401);
  }

  const token = header.slice(7).trim();

  if (!token) {
    throw new AuthError("Missing authorization token.", 401);
  }

  try {
    return await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new AuthError("Invalid or expired session. Please sign in again.", 401);
  }
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
