import type { Metadata } from "next";
import { Geist_Mono, Poppins, Inter } from "next/font/google";
import RootProvider from "@/src/providers/RootProvider";
import { AppTitle } from "@/src/components/app-title";
import Head from "next/head";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const APP_NAME = process.env.APP_NAME || "Mitch-Jelly";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "A modern, streamlined Jellyfin client.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Head>
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body
        className={`${inter.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <RootProvider>
          <AppTitle />
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
