import type { NextConfig } from "next";
import path from "node:path";

const buildRoot = process.env.VERCEL
  ? path.resolve(__dirname)
  : path.resolve(__dirname, "../../");

const nextConfig: NextConfig = {
  outputFileTracingRoot: buildRoot,
  turbopack: {
    root: buildRoot,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },
};

export default nextConfig;
