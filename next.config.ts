import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep unpdf (and its bundled serverless pdfjs) out of the Next bundle so it
  // loads from node_modules at runtime — the same way it works standalone.
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
