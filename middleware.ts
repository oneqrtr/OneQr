import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // Define main domain (for development use localhost)
    const currentHost = hostname.replace(/:\d+$/, '') // Remove port
    const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
    const rootDomain = isLocal ? 'localhost' : 'oneqr.tr'

    // Check if we are on a custom subdomain
    const isSubdomain = currentHost !== rootDomain && currentHost !== `www.${rootDomain}`

    if (isSubdomain) {
        const subdomain = currentHost.split('.')[0]

        // Exclude reserved subdomains
        const reservedSubdomains = ['www', 'admin', 'app', 'api', 'supabase', 'mail', 'smtp', 'secure']
        if (reservedSubdomains.includes(subdomain)) {
            return NextResponse.next()
        }

        // Rewrite calls to subdomain to /menu/[slug]
        // Example: user.oneqr.tr -> /menu/user
        console.log(`Rewriting subdomain ${subdomain} to /menu/${subdomain}${url.pathname}`)
        url.pathname = `/menu/${subdomain}${url.pathname}`
        return NextResponse.rewrite(url)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folders
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
