import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "./components/Navigation";
import "./globals.css";
import AntdReact19Patch from "./components/AntdReact19Patch";
import GlobalIaCTemplatePanelWrapper from "./components/ui/GlobalIaCTemplatePanelWrapper";
import IaCPanelDebugger from "./components/ui/IaCPanelDebugger";

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
        <AntdReact19Patch />
        <Navigation />
        <GlobalIaCTemplatePanelWrapper />
        <IaCPanelDebugger />
          
        <div className="content">
          {children}
        </div>
      </body>
    </html>
  );
}
