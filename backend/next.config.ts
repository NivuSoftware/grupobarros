import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Serve files from public/uploads as static assets
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
