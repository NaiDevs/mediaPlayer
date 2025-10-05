import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppShell from '../components/AppShell'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spectra Player",
  description: "Observa, analiza y revive cada sesión de tus usuarios con estilo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}> 
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
