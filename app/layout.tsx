// app/layout.tsx
import "./globals.css";
import { Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Ngunga - Gestão de Igrejas",
  description:
    "Plataforma completa para gestão de igrejas: membros, ministérios, eventos, finanças e comunicação em um só lugar.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {


  return (
    <html
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans antialiased">
       {children}
      </body>
    </html>
  );
}