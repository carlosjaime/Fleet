import type { Metadata, Viewport } from "next";
import { Chivo, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { publicEnv } from "@/config/env";
import "@/styles/globals.css";

const chivo = Chivo({
  subsets: ["latin"],
  variable: "--font-chivo",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

/**
 * Fuente de marca: usada en el logotipo, títulos hero y encabezados de
 * marca (sidebar, panel de autenticación, landing). Deliberadamente
 * distinta de Chivo (texto de interfaz) y JetBrains Mono (telemetría) para
 * que la identidad de FleetOps tenga una voz tipográfica propia.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${publicEnv.NEXT_PUBLIC_APP_NAME} · Centro de control logístico`,
    template: `%s · ${publicEnv.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "Plataforma de administración y monitoreo de flotillas de camiones para Latinoamérica.",
};

export const viewport: Viewport = {
  themeColor: "#090A0F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={`${chivo.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <QueryProvider>{children}</QueryProvider>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: "#171A23",
              border: "1px solid #272B36",
              color: "#F4F6F8",
            },
          }}
        />
      </body>
    </html>
  );
}
