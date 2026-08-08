import type { NextConfig } from "next";

/**
 * El host del store de Blob. Se pone como variable para que apunte al store de
 * verdad: con el comodín suelto, cualquier store de la plataforma se podría
 * optimizar a través de esta cuenta.
 */
const BLOB = process.env.NEXT_PUBLIC_BLOB_HOST ?? "*.public.blob.vercel-storage.com";

const nextConfig: NextConfig = {
  images: {
    // `images.domains` está deprecado en Next 16. Y el `pathname` no es adorno:
    // acota el proxy a las fotos del museo y nada más.
    remotePatterns: [
      { protocol: "https", hostname: BLOB, pathname: "/piezas/**", search: "" },
    ],
  },
};

export default nextConfig;
