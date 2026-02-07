import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const url = request.nextUrl;
    let hostname = request.headers.get('host') || '';

    // Remove port if present (for localhost development)
    hostname = hostname.split(':')[0];

    // Define domains that serve the main application/landing page
    // The user specified 'demo.oneqr.tr' as the main domain.
    const mainDomains = ['demo.oneqr.tr', 'www.oneqr.tr', 'oneqr.tr', 'localhost'];

    // If the current hostname is a main domain, allow standard routing
    if (mainDomains.includes(hostname)) {
        return NextResponse.next();
    }

    // Otherwise, treat it as a tenant subdomain (e.g., [slug].oneqr.tr)
    let subdomain = '';
    const parts = hostname.split('.');

    // Extract subdomain logic
    if (hostname.endsWith('localhost')) {
        // e.g., slug.localhost
        if (parts.length > 1) subdomain = parts[0];
    } else {
        // e.g., slug.oneqr.tr
        // Assumes the domain is always something.oneqr.tr
        if (hostname.endsWith('oneqr.tr') && parts.length > 2) {
            subdomain = parts[0];
        }
    }

    // If a valid subdomain is found (and it's not a reserved one like 'www')
    if (subdomain && !['www', 'demo'].includes(subdomain)) {
        // Rewrite the URL to the public menu page
        // e.g., restaurant.oneqr.tr/cart -> /menu/restaurant/cart
        url.pathname = `/menu/${subdomain}${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (if any needed)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
