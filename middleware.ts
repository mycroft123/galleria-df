// middleware.ts (place in your project root, same level as package.json)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Check if we're on the root path
  if (url.pathname === '/') {
    // Create the redirect URL with the portfolio path and chat view
    const redirectUrl = new URL('/portfolio/ExK2ZcWx6tpVe5xfqkHZ62bMQNpStLj98z2WDUWKUKGp', url);
    redirectUrl.searchParams.set('view', 'chat');
    
    // Return a permanent redirect (308)
    return NextResponse.redirect(redirectUrl, 308);
  }
  
  return NextResponse.next();
}

// Configure middleware to only run on the homepage
export const config = {
  matcher: '/',
};