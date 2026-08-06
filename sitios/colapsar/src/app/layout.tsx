import type { Metadata, Viewport } from "next";
import { Courier_Prime, Instrument_Serif } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const titulo = `${site.cancion} — ${site.artista}`;
const descripcion = "Museo de cosas que nunca pasaron.";

export const metadata: Metadata = {
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
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
