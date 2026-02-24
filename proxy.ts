import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req:    request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Not logged in — redirect to login
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Pending user — redirect to pending page
  if (token?.status === "PENDING" && !pathname.startsWith("/pending")) {
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  // Rejected user — redirect to rejected page
  if (token?.status === "REJECTED" && !pathname.startsWith("/rejected")) {
    return NextResponse.redirect(new URL("/rejected", request.url));
  }

  // Active user trying to access pending/rejected pages
  if (token?.status === "ACTIVE" && (pathname.startsWith("/pending") || pathname.startsWith("/rejected"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/pending", "/rejected"],
};