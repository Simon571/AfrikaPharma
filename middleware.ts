import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { trialMiddleware } from '@/lib/trial-middleware';

export default withAuth(
  async function middleware(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    // Always allow access to public routes
    if (path.startsWith('/login-admin') || 
        path.startsWith('/login-seller') || 
        path.startsWith('/login-common') ||
        path.startsWith('/api/') ||
        path.startsWith('/subscription-required') ||
        path.startsWith('/trial-limited') ||
        path.startsWith('/subscription') ||
        path === '/') {
      return NextResponse.next();
    }

    // If no token, redirect to appropriate login page
    if (!token) {
      if (path.startsWith('/admin-dashboard') || path.startsWith('/medications') || path.startsWith('/sales') || path.startsWith('/users') || path.startsWith('/admin/')) {
        return NextResponse.redirect(new URL('/login-admin', req.url));
      }
      if (path.startsWith('/seller-dashboard') || path.startsWith('/sell')) {
        return NextResponse.redirect(new URL('/login-seller', req.url));
      }
      // Fallback for other protected routes if any, or if the matcher is broader
      return NextResponse.redirect(new URL('/login-common', req.url)); // Assuming /login-common is a generic login
    }

    // Admin access control
    if (path.startsWith('/admin-dashboard') || path.startsWith('/medications') || path.startsWith('/sales') || path.startsWith('/users') || path.startsWith('/admin/')) {
      if (token.role !== 'admin') {
        return NextResponse.redirect(new URL('/login-admin', req.url)); // Redirect to admin login if not admin
      }
    }

    // Seller access control
    if (path.startsWith('/seller-dashboard') || path.startsWith('/sell')) {
      if (token.role !== 'seller') {
        return NextResponse.redirect(new URL('/login-seller', req.url)); // Redirect to seller login if not seller
      }
    }

    // Apply trial verification middleware for premium features
    const trialResponse = await trialMiddleware(req);
    if (trialResponse) {
      return trialResponse; // Trial middleware handled the request (redirect or block)
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Always allow public routes
        if (path.startsWith('/login-admin') || 
            path.startsWith('/login-seller') || 
            path.startsWith('/login-common') ||
            path.startsWith('/api/') ||
            path === '/' ||
            path.startsWith('/subscription-required') ||
            path.startsWith('/trial-limited') ||
            path.startsWith('/subscription')) {
          return true;
        }
        
        // For protected routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login pages
     * Temporarily disable to debug
     */
    '/disabled-middleware-for-debugging',
  ],
};