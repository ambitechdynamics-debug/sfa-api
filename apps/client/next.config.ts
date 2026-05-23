import type { NextConfig } from "next";
import path from "node:path";

const buildRoot = process.env.VERCEL
  ? path.resolve(__dirname)
  : path.resolve(__dirname, "../../");

const SONNER_SHIM = path.resolve(__dirname, "lib/sonner-shim.ts");

const nextConfig: NextConfig = {
  // Silence the multi-lockfile warning by anchoring Turbopack to this folder
  outputFileTracingRoot: buildRoot,
  turbopack: {
    root: buildRoot,
    // Neutralise les notifications flottantes (sonner) sans toucher aux 11
    // fichiers qui l'importent — cf. lib/sonner-shim.ts
    resolveAlias: {
      sonner: "./lib/sonner-shim.ts",
    },
  },
  // Fallback webpack si Turbopack n'est pas utilisé
  webpack: (config) => {
    config.resolve ??= {};
    (config.resolve as { alias?: Record<string, string> }).alias ??= {};
    ((config.resolve as { alias: Record<string, string> }).alias)["sonner"] = SONNER_SHIM;
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
