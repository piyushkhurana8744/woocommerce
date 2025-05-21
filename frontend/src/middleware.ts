import { NextRequest, NextResponse } from "next/server";


// Define protected routes (customize as needed)
const protectedRoutes = ["/dashboard", "/product", "/customers", "/settings", "/integration"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;


  // Only protect specified routes
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    // Check for token in cookies
    const tokenCookie = req.cookies.get("token")?.value;
    
    // If no token in cookies or localStorage, redirect to sign-in
    if (!tokenCookie) {
      // Redirect to sign-in if no token
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }
  }
  
  // Special handling for root path
  if (pathname === "/") {
    // Redirect root to /product (or any default protected route)
    return NextResponse.redirect(new URL("/product", req.url));
  }

  // Allow access to all other routes
  return NextResponse.next();
}

// Specify the matcher for middleware
export const config = {
  matcher: [
    "/", 
    "/dashboard/:path*", 
    "/product/:path*", 
    "/customers/:path*", 
    "/settings/:path*",
    "/integration/:path*"
  ],
};