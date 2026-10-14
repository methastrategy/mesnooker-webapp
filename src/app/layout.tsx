import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MESNOOKER",
  description:
    "Premium snooker scoring and money settlement for Thai players. Point or ball count, live targets, minimal-transfer settlement, offline-ready PWA.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MESNOOKER",
  },
  applicationName: "MESNOOKER",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${fraunces.variable} ${jakarta.variable} ${geistMono.variable}`}
    >
      <body className="min-h-[100dvh] bg-background font-sans text-foreground antialiased selection:bg-primary/20 selection:text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}