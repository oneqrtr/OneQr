import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    // Temporary simplified middleware to avoid 500 errors
    // We will rely on Client Side Auth protection for now

    // Just pass through everything
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
