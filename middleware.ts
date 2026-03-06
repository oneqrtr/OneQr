import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    // Vercel/proxy can send original host in x-forwarded-host
    const hostRaw = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const hostname = hostRaw.replace(/:\d+$/, '') // Remove port

    const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
    const rootDomain = isLocal ? 'localhost' : 'oneqr.tr'

    // Check if we are on a custom subdomain (e.g. restoran.oneqr.tr)
    const isSubdomain = hostname !== rootDomain && hostname !== `www.${rootDomain}`

    if (isSubdomain) {
        const subdomain = hostname.split('.')[0]

        // Exclude reserved subdomains
        const reservedSubdomains = ['www', 'admin', 'app', 'api', 'supabase', 'mail', 'smtp', 'secure', 'demo']
        if (reservedSubdomains.includes(subdomain)) {
            return NextResponse.next()
        }

        // Rewrite subdomain to restoran sayfası: slug.oneqr.tr -> /menu/[slug]
        const basePath = `/menu/${subdomain}`
        const pathname = url.pathname === '/' || url.pathname === '' ? basePath : `${basePath}${url.pathname}`
        url.pathname = pathname
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
