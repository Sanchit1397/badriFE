import type { Metadata } from "next";
import Nav from "@/components/Nav";
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
  title: "BadrikiDukaan",
  description: "BadrikiDukaan - Your online store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b">
          <Nav />
        </header>
        <main className="mx-auto max-w-5xl p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
