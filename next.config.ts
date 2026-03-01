import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    // Allow data URLs for QR codes rendered server-side
    remotePatterns: [],
  },
};

export default nextConfig;
