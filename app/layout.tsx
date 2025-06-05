import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
// import Navigation from "./components/Navigation"; // Navigation se moverá a (app)/layout.tsx
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
}: {
  children: React.ReactNode;
}) {
  return <html lang="es" className={`${inter.variable} ${geistMono.variable} scroll-smooth h-full bg-slate-50 dark:bg-slate-900`}>
      <body className={`${inter.className} antialiased text-slate-900 dark:text-slate-50 h-full`}>
        <AntdReact19Patch />
        {/* <Navigation />  Se elimina de aquí */}
        <GlobalIaCTemplatePanelWrapper /> {/* Asumiendo que estos son globales o se manejan contextualmente */}
        <IaCPanelDebugger />
          
        {/* El div con className="content" podría no ser necesario aquí si cada layout de grupo maneja su propia estructura */}
        {children} 
      </body>
    </html>;
}
