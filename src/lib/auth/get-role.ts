import { getAdminAuth } from "@/lib/firebase-admin-auth";

export type UserRole = "admin" | "user";

/**
 * Server-side: extract the user's role from a verified Firebase ID token.
 * Falls back to "user" if no role claim is set.
 */
export async function getRoleFromToken(idToken: string): Promise<UserRole> {
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const role = decoded.role as string | undefined;
    return role === "admin" ? "admin" : "user";
  } catch {
    return "user";
  }
}
