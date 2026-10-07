import type { Metadata } from "next";
import "./globals.css";
import { TutorProvider } from "@/lib/context/tutor-context";
import { Navbar } from "@/components/Navbar";
import { MiaFloatingCompanion } from "@/components/MiaFloatingCompanion";

export const metadata: Metadata = {
  title: "MACHTIA Adaptive Tutor - Tutor IA Educativo",
  description: "Tutor inteligente educativo adaptativo para Hackathon Amazon / Alexa+ y Nebius / NVIDIA",
  icons: {
    icon: "/machtia-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen flex flex-col bg-slate-50 text-slate-900">
        <TutorProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <MiaFloatingCompanion />
          <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            <p>
              MACHTIA Adaptive Tutor • Desarrollado para Hackathon Amazon / Alexa+ • Protocolo MCP Compatible
            </p>
          </footer>
        </TutorProvider>
      </body>
    </html>
  );
}
