import type { NextConfig } from "next";

/**
 * Los dos únicos dominios de imagen que el sitio puede optimizar.
 *
 * `static.wixstatic.com` es donde viven las fotos de producto de la tienda y lo
 * que ella suba al CMS; `i.scdn.co` es donde Spotify sirve las carátulas. El
 * comodín suelto dejaría que cualquiera optimice imágenes a través de esta
 * cuenta, y eso se paga.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@shonny/escenografia", "@shonny/datos"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "static.wixstatic.com" },
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "colapsar.shonny.co" },
    ],
    qualities: [75, 90],
  },
};

export default nextConfig;
