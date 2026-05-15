import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthProvider";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
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
      <body className={`${bricolage.variable} ${geist.variable} ${geistMono.variable} ${instrument.variable}`}>
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
