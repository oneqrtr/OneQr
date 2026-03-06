import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    // Orijinal host: Farklı ağ/cihazda Host bazen oneqr.tr geliyor; x-forwarded-host istemcinin açtığı adres (slug.oneqr.tr).
    const forwarded = (request.headers.get('x-forwarded-host') || '').split(',')[0].trim()
    const hostHeader = (request.headers.get('host') || '').split(',')[0].trim()
    const hostRaw = forwarded || hostHeader
    const hostname = hostRaw.replace(/:\d+$/, '')

    const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1')
    const rootDomain = isLocal ? 'localhost' : 'oneqr.tr'

    // Subdomain kontrolü: restoran.oneqr.tr gibi
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
