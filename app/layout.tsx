import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Navigation from "./components/Navigation";
import "./globals.css";
import AntdReact19Patch from "./components/AntdReact19Patch";
import GlobalIaCTemplatePanelWrapper from "./components/ui/GlobalIaCTemplatePanelWrapper";
import IaCPanelDebugger from "./components/ui/IaCPanelDebugger";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InfraUX - Visual Cloud Infrastructure",
  description: "Inicia sesión en InfraUX para visualizar y gestionar tu infraestructura cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (<html lang="es" className={`${inter.variable} ${geistMono.variable} scroll-smooth`}>
      <body className={`${inter.className} antialiased`}>
        <AntdReact19Patch />
        <Navigation />
        <GlobalIaCTemplatePanelWrapper />
        <IaCPanelDebugger />
          
        <div className="content">
          {children}
        </div>
      </body>
    </html>);
}
