import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge Middleware — protects /admin routes.
 * Firebase ID tokens are JWTs — we decode the payload (no verify at edge,
 * actual verification happens in API routes via firebase-admin).
 * This is a lightweight UX guard; security is enforced server-side.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin paths
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Read session cookie or Authorization header
  const sessionCookie = request.cookies.get("session")?.value;
  const authHeader = request.headers.get("authorization");
  const token = sessionCookie ?? authHeader?.replace("Bearer ", "");

  // No token → redirect to sign-up
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-up";
    return NextResponse.redirect(url);
  }

  // Decode JWT payload (middle segment) without verification
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf-8")
    );

    // Token expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const url = request.nextUrl.clone();
      url.pathname = "/sign-up";
      return NextResponse.redirect(url);
    }

    // Not an admin → redirect to dashboard
    if (payload.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch {
    // Malformed token — let client-side guard handle it
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
