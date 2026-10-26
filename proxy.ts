import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth && !req.auth.error;

  // NextAuth endpoints bypass proxy
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Login route
  if (pathname === "/login") {
    if (isLoggedIn) {
      const rawCallbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      // Prevent open redirect vulnerabilities; permit relative paths only
      const targetUrl =
        rawCallbackUrl &&
        rawCallbackUrl.startsWith("/") &&
        !rawCallbackUrl.startsWith("//")
          ? rawCallbackUrl
          : "/";
      return NextResponse.redirect(new URL(targetUrl, req.url));
    }
    return NextResponse.next();
  }

  // Protected portal routes
  if (!isLoggedIn) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - static assets (svg, png, jpg, jpeg, gif, webp, ico, woff, woff2, ttf)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)",
  ],
};
