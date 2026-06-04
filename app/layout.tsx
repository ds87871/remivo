import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  metadataBase: new URL("https://remivo-beta.vercel.app"),
  title: "Remivo | Live Money Transfer Rate Comparison",
  description: "Compare live money transfer rates from Wise, Remitly, PaySend, and others. Find the best rates and discover hidden fees for sending money to India in real-time.",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    images: [{ url: "/logo-dark.svg" }]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
