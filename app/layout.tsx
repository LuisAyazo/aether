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
  title: "Aether - AI-Powered Infrastructure Fabric",
  description: "Open-source Infrastructure as Code (IaC) platform with visual interface and AI assistance for simplified cloud management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="fixed w-full bg-background/80 backdrop-blur-md z-50 py-4 px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <a href="/" className="text-xl font-bold">Aether</a>
            <div className="hidden md:flex gap-8">
              <a href="#features" className="hover:text-gray-600 dark:hover:text-gray-300">Features</a>
              <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Docs</a>
              <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">About</a>
              <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Blog</a>
            </div>
            <a 
              href="#" 
              className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors px-4 py-2 text-sm hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a]"
            >
              Sign Up
            </a>
          </div>
        </nav>
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  );
}
