import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect()
    }

    // Allow Clerk Scripts
    const response = NextResponse.next()
    response.headers.set(
        'Content-Security-Policy',
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.com https://*.clerk.accounts.dev;"
    )
    return response
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
