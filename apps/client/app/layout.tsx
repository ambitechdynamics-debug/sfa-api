import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AuthProvider } from "@/context/AuthProvider";
import { ChunkReloadGuard } from "@/components/app/ChunkReloadGuard";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import "./globals.css";
import "./landing.css";
import "./auth.css";
import "./app-shell.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-artistic",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Consilium Design — Create professional visuals with AI",
  description: "Generate custom advertising visuals in minutes with AI. Posters, flyers, stories, banners, every format and every style.",
  applicationName: "Consilium Design",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Consilium",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

/**
 * Extract the Clerk Frontend API hostname from the publishable key.
 *
 * Clerk encodes the FAPI domain in the `pk_test_`/`pk_live_` token as
 * base64url with a trailing `$`. Decoding it gives e.g.
 * `clerk.your-domain.com$` or `secure-jaybird-13.clerk.accounts.dev$`.
 *
 * Why: the Clerk JS SDK is fetched from that host *after* HTML parse, which
 * adds a DNS+TLS round-trip and delays `signInReady`. Preconnecting in the
 * HTML head starts that handshake in parallel with the rest of the page.
 */
function getClerkFapiHost(): string | null {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const idx = pk.indexOf("_");
  const payload = pk.slice(idx + 1).replace(/^test_|^live_/, "");
  if (!payload) return null;
  try {
    const decoded = Buffer.from(payload, "base64").toString("utf8").replace(/\$$/, "");
    return decoded || null;
  } catch {
    return null;
  }
}

function getApiOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!raw || !raw.startsWith("http")) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkHost = getClerkFapiHost();
  const apiOrigin = getApiOrigin();

  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark" data-density="regular">
        <head>
          {clerkHost ? (
            <>
              <link rel="preconnect" href={`https://${clerkHost}`} crossOrigin="" />
              <link rel="dns-prefetch" href={`https://${clerkHost}`} />
            </>
          ) : null}
          <link rel="preconnect" href="https://clerk-telemetry.com" crossOrigin="" />
          <link rel="dns-prefetch" href="https://clerk-telemetry.com" />
          {apiOrigin && apiOrigin.startsWith("https://") ? (
            <>
              <link rel="preconnect" href={apiOrigin} crossOrigin="" />
              <link rel="dns-prefetch" href={apiOrigin} />
            </>
          ) : null}
        </head>
        <body className={`${inter.variable} ${playfair.variable}`}>
          <ChunkReloadGuard />
          <ServiceWorkerRegister />
          <AuthProvider>{children}</AuthProvider>
          <InstallPrompt />
        </body>
      </html>
    </ClerkProvider>
  );
}
