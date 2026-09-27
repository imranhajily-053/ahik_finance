import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Bənd 60: Reader is blocked from mutating API calls even before the
    // request reaches the route handler. This is a *first* line of defense;
    // every route handler re-checks permissions independently (see rbac.ts) —
    // this middleware alone is never treated as sufficient.
    if (
      pathname.startsWith("/api/") &&
      MUTATING_METHODS.has(req.method) &&
      token?.role === "READER"
    ) {
      return NextResponse.json(
        { error: "Reader rolü ilə dəyişiklik etmək mümkün deyil." },
        { status: 403 }
      );
    }

    // Reader can't reach the settings UI at all.
    if (pathname.startsWith("/settings") && token?.role === "READER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ledger/:path*",
    "/membership-fees/:path*",
    "/sanatorium/:path*",
    "/debt/:path*",
    "/cultural-events/:path*",
    "/overnight/:path*",
    "/president-administration/:path*",
    "/audit-log/:path*",
    "/settings/:path*",
    "/api/transactions/:path*",
    "/api/organizations/:path*",
    "/api/purposes/:path*",
    "/api/reports/:path*",
    "/api/kpi/:path*",
    "/api/audit-logs/:path*",
    "/api/export/:path*",
  ],
};
