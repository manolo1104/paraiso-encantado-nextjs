import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paraiso Encantado | Tu Casa en la Huasteca",
  description: "Retiro de lujo en la selva potosina. 15 suites con piscina privada, restaurante gourmet y vistas panorámicas. A 7 minutos del Centro de Xilitla.",
  keywords: "hotel, lujo, Xilitla, San Luis Potosí, huasteca, suite, reservas, naturaleza",
  openGraph: {
    title: "Paraiso Encantado | Tu Casa en la Huasteca",
    description: "Retiro de lujo en la selva potosina",
    type: "website",
    url: "https://paraisoencantado.com",
    images: [
      {
        url: "https://paraisoencantado.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Paraiso Encantado Hotel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Paraiso Encantado",
    description: "Tu refugio surrealista en la Huasteca Potosina",
    images: ["https://paraisoencantado.com/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://paraisoencantado.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        
        {/* Google Site Verification (opcional) */}
        <meta name="google-site-verification" content="xxxxx" />
        
        {/* Preconnect */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <Providers>
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
