import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const { pathname } = request.nextUrl;

    // Development/Localhost handling
    const isDev = hostname.includes('localhost');
    const isAppDomain = hostname.startsWith('app.') || (isDev && pathname.startsWith('/_app_debug')); // simple debug hook if needed

    // Case 1: App Domain (app.oneqr.tr)
    if (isAppDomain) {
        // If visiting root of app domain, redirect to login
        if (pathname === '/') {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        // Allow all other routes on app domain to proceed naturally
        return NextResponse.next();
    }

    // Case 2: Marketing Domain (oneqr.tr)
    // If accessing App routes on Marketing domain -> Redirect to App domain
    const appRoutes = ['/admin', '/superadmin', '/login', '/register', '/onboarding'];
    if (appRoutes.some(route => pathname.startsWith(route))) {
        // In dev, we can't easily redirect to subdomains without hosts file, 
        // but in prod this is critical.
        if (!isDev) {
            const newUrl = new URL(request.url);
            newUrl.hostname = 'app.oneqr.tr';
            return NextResponse.redirect(newUrl);
        }
    }

    // Public Menu Handling:
    // Menus should probably be accessible on both, or specifically one.
    // Usually oneqr.tr/m/slug is nice and short. We keep it allowed on main domain.

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
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
