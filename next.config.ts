import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fnlbwadnxticcdbmdahi.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/admin/theme', destination: '/admin/settings/theme', permanent: true },
      { source: '/admin/qr', destination: '/admin/settings/qr', permanent: true },
    ];
  },
};

export default nextConfig;
