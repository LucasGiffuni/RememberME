import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RememberME",
  description: "Tu asistente personal con IA - tareas, recordatorios y organización del día",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RememberME",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es" className={`${geistSans.variable} h-full`}>
        <head>
          <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        </head>
        <body className="h-full flex flex-col safe-area-top safe-area-bottom">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
