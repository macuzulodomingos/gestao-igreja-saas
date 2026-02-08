// app/layout.tsx
import "./globals.css";
import { Playfair_Display, Inter } from "next/font/google";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers"; // ✅ Importamos o wrapper

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
  title: "ChurchOS - Gestão de Igrejas",
  description:
    "Plataforma completa para gestão de igrejas: membros, ministérios, eventos, finanças e comunicação em um só lugar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="pt-BR" 
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning // ✅ Evita avisos de conflito com o ThemeProvider
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        {/* ✅ O Providers envolve toda a aplicação */}
        <Providers>
          {children}
          
          {/* Toaster posicionado para não sobrepor elementos da UI */}
          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  );
}