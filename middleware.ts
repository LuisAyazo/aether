import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client for middleware
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const pathname = request.nextUrl.pathname;
  
  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/auth/callback',
    '/api/auth',
    '/test-auth',
    '/test-modal',
    '/test-generated-code-modal',
    // Add other public routes here
  ];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // For protected routes, check authentication
  try {
    // Get the auth token from cookies
    const cookieStore = request.cookies;
    
    // Supabase sets cookies with a pattern like sb-[project-ref]-auth-token
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    
    // Check for various possible cookie names
    const possibleCookieNames = [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-auth-token-code-verifier`,
      'sb-auth-token',
      'sb-access-token',
      'sb-refresh-token'
    ];
    
    let hasAuthCookie = false;
    for (const cookieName of possibleCookieNames) {
      if (cookieStore.get(cookieName)) {
        hasAuthCookie = true;
        console.log(`[Middleware] Found auth cookie: ${cookieName}`);
        break;
      }
    }
    
    // Also check localStorage as fallback (this won't work in middleware, but we'll allow the request)
    // The client-side will handle the redirect if needed
    
    // If no auth cookie, redirect to login
    if (!hasAuthCookie) {
      console.log(`[Middleware] No auth cookie found for protected route: ${pathname}`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Token exists, allow access
    return NextResponse.next();
    
  } catch (error) {
    console.error('[Middleware] Error:', error);
    // On error, allow the request to proceed
    // The client-side will handle authentication
    return NextResponse.next();
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
