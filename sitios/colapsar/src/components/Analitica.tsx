"use client";

import { useEffect } from "react";
import { encender } from "@/lib/analitica";

/**
 * Enciende Mixpanel una vez, ya montado y con el navegador desocupado.
 *
 * Es un componente y no una llamada suelta en el layout porque el layout corre
 * en el servidor y el SDK toca `window` y `localStorage`. No pinta nada.
 *
 * Va en `requestIdleCallback` y no en el efecto a secas porque el SDK son 125 KB
 * más un grabador de 104 KB: pedirlos durante la hidratación es pelearle el
 * ancho de banda a las fotos. El tope de 2s es por Safari, que no tiene
 * `requestIdleCallback`, y por si la página nunca queda ociosa.
 */
export function Analitica() {
  useEffect(() => {
    const pedir = () => encender();

    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(pedir, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }

    const id = setTimeout(pedir, 1500);
    return () => clearTimeout(id);
  }, []);

  return null;
}
