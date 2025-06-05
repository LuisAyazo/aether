import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "../globals.css"; // Ajustar ruta si es necesario, asumiendo que globals.css está en app/
import AntdReact19Patch from "../components/AntdReact19Patch"; // Ajustar ruta

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
  title: "InfraUX - Autenticación",
  description: "Accede a tu cuenta de InfraUX.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Los layouts anidados no deben incluir <html> o <body> tags.
  // Esas etiquetas son manejadas por el RootLayout.
  return (
    <>
      <AntdReact19Patch />
      {/* El div con className="content" podría ser necesario si RootLayout no lo provee directamente o si se quiere un anidamiento específico */}
      {/* Por ahora, solo renderizamos children directamente, asumiendo que RootLayout maneja la estructura principal */}
      {children}
    </>
  );
}
