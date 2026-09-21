import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Content Security Policy. 'unsafe-inline' scripts/styles are needed by Next.js hydration and Tailwind output;
// the important protections are the allow-lists for where things may load from and who may frame the site.
// Instagram is allowed because the Media page embeds reels; Unsplash hosts the default tasting photo.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.instagram.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.cdninstagram.com",
  "font-src 'self' data:",
  "connect-src 'self' https://www.instagram.com",
  'frame-src https://www.instagram.com https://instagram.com',
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests'
].join('; ');

const securityHeaders = [
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
  {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()'},
  {key: 'Content-Security-Policy', value: csp}
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      }
    ]
  },
  // "/" has no page of its own: send Spanish-language browsers to /es and everyone else to /en.
  // (middleware.ts used to sit here but at the project root it was never loaded, since the app lives in src/.)
  async redirects() {
    return [
      {source: '/', has: [{type: 'header' as const, key: 'accept-language', value: '^es.*'}], destination: '/es', permanent: false},
      {source: '/', destination: '/en', permanent: false}
    ];
  },
  // Only in production: the dev server needs eval for hot reloading, which the policy above would block.
  async headers() {
    return process.env.NODE_ENV === 'production' ? [{source: '/:path*', headers: securityHeaders}] : [];
  }
};

export default withNextIntl(nextConfig);
