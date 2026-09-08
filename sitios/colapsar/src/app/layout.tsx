import type { Metadata, Viewport } from "next";
import { instrument, courier } from "@shonny/escenografia/fuentes";
import { Analitica } from "@/components/Analitica";
import { site } from "@/content/site";
import "./globals.css";


const titulo = `${site.cancion} — ${site.artista}`;
const descripcion = "Museo de cosas que nunca pasaron.";

// La portada del OG se declara con ruta relativa, así que sin base Next la
// resuelve contra localhost:3000 y el link no muestra imagen en ningún lado.
// Vercel expone el dominio de producción en build; en local vale el puerto que
// haya. Es lo único de la página que solo se rompe una vez publicada.
const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT ?? 3000}`;

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: titulo,
  description: descripcion,
  openGraph: {
    title: titulo,
    description: descripcion,
    images: [{ url: site.portada, width: 1000, height: 1000 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descripcion,
    images: [site.portada],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${instrument.variable} ${courier.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Analitica />
        {children}
      </body>
    </html>
  );
}
