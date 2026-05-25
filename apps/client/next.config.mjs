import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const buildRoot = process.env.VERCEL
  ? path.resolve(__dirname)
  : path.resolve(__dirname, "../../");

const SONNER_SHIM = path.resolve(__dirname, "lib/sonner-shim.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: buildRoot,
  turbopack: {
    root: buildRoot,
    resolveAlias: {
      sonner: "./lib/sonner-shim.ts",
    },
  },
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias["sonner"] = SONNER_SHIM;
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
