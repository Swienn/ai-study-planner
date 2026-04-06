import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for pdf-parse v2 (uses pdfjs-dist worker with dynamic requires)
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
