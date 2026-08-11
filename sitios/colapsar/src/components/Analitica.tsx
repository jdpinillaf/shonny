"use client";

import { useEffect } from "react";
import { encender } from "@/lib/analitica";

/**
 * Enciende Mixpanel una vez, ya montado.
 *
 * Es un componente y no una llamada suelta en el layout porque el layout corre
 * en el servidor y el SDK toca `window` y `localStorage`. No pinta nada.
 */
export function Analitica() {
  useEffect(() => {
    encender();
  }, []);

  return null;
}
