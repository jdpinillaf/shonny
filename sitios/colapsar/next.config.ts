import type { NextConfig } from "next";

/**
 * El host del store de Blob. Se pone como variable para que apunte al store de
 * verdad: con el comodín suelto, cualquier store de la plataforma se podría
 * optimizar a través de esta cuenta.
 */
const BLOB = process.env.NEXT_PUBLIC_BLOB_HOST ?? "*.public.blob.vercel-storage.com";

const nextConfig: NextConfig = {
  // `@shonny/escenografia` no tiene paso de build: manda TypeScript crudo, y
  // `next/font` dentro del paquete se resuelve en el build de este sitio.
  transpilePackages: ["@shonny/escenografia"],

  images: {
    // `images.domains` está deprecado en Next 16. Y el `pathname` no es adorno:
    // acota el proxy a las fotos del museo y nada más.
    remotePatterns: [
      { protocol: "https", hostname: BLOB, pathname: "/piezas/**", search: "" },
    ],

    // Next 16 rechaza cualquier `quality` que no esté declarada acá. 50 es el de
    // los televisores, que van en gris bajo viñeta y grano; 75 es el default,
    // que usan la portada y la foto abierta en grande.
    qualities: [50, 75],

    // Un año. El default son 4 horas, así que la transformación se rehacía sola
    // varias veces al día. Ojo con lo que *no* hace: en Vercel esto manda sobre
    // la caché del CDN, no sobre lo que se le dice al navegador. El
    // `cache-control` que sale hacia fuera es `max(minimumCacheTTL, el del
    // origen)`, y en Vercel los archivos de `public/` salen con `max-age=0`, así
    // que el máximo daba 0. Por eso el bloque `headers()` de abajo.
    minimumCacheTTL: 31536000,

    // Fuera 2048 y 3840. El original mide 780px de ancho: todo lo de arriba es
    // pedirle al optimizador que agrande una foto para luego encogerla en CSS.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  /**
   * Vercel sirve todo lo de `public/` con `cache-control: public, max-age=0,
   * must-revalidate`. No cuesta bytes —revalida con `last-modified` y responde
   * 304— pero sí una ida y vuelta por archivo y por visita: cinco fotos más el
   * mp3, cada uno con su viaje al POP antes de poder pintar nada.
   *
   * Estos dos son inmutables de verdad: el nombre lleva la versión dentro (las
   * fotos, el sufijo `-bn`; el mp3, los segundos del adelanto), así que cambiar
   * el contenido ya obliga a cambiar la ruta. Eso es justo lo que `immutable`
   * pide a cambio de que el navegador no vuelva a preguntar en un año.
   */
  async headers() {
    return [
      {
        source: "/fotos/:archivo*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/audio/:archivo*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
