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
  title: "Studio Flyer AI — Create professional visuals with AI",
  description: "Generate custom advertising visuals in minutes with AI. Posters, flyers, stories, banners, every format and every style.",
  applicationName: "Studio Flyer AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StudioFlyer",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" data-theme="dark" data-density="regular">
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
