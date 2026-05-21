import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Studio Flyer AI — Créez des affiches professionnelles avec l'IA",
  description: "Générez des visuels publicitaires sur-mesure en quelques minutes grâce à l'IA. Affiches, flyers, stories, bannières — tous formats, tous styles.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" data-density="regular">
      <body className={inter.variable}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster
          position="bottom-center"
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--bg-2)",
              color: "var(--ink-0)",
              border: "1px solid var(--line-2)",
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
