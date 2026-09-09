import type { Metadata, Viewport } from "next";
import { fraunces, jost } from "@shonny/escenografia/fuentes-paraiso";
import { contenido } from "@shonny/datos";
import "./globals.css";

/**
 * La base de las URLs del OG. Con ruta relativa y sin base, Next la resuelve
 * contra localhost y el link no muestra imagen en ningún lado — que es lo único
 * de la página que solo se rompe una vez publicada.
 */
const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT ?? 3000}`;

const titulo = "Shonny — Ave del paraíso";
const descripcion =
  "Pop con consciencia desde el Caribe. Canciones escritas desde adentro para que suenen como mantras.";

export const metadata: Metadata = {
  metadataBase: new URL(base),
  title: titulo,
  description: descripcion,
  openGraph: {
    title: titulo,
    description: descripcion,
    images: [{ url: contenido.artista.retratos[0], width: 1067, height: 1600 }],
    type: "website",
    locale: "es_CO",
  },
  twitter: { card: "summary_large_image", title: titulo, description: descripcion },
};

export const viewport: Viewport = {
  themeColor: "#efe3df",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jost.variable}`}>
      <body>{children}</body>
    </html>
  );
}
