export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/receipts/:path*', '/requests/:path*', '/consolidated/:path*', '/myinvois/:path*', '/ai-accountant/:path*', '/settings/:path*']
};
