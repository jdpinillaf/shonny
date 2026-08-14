"use client";

import { useSyncExternalStore } from "react";

/** El mismo corte que usa Tailwind para `md:`. Si allá cambia, acá también. */
const CONSULTA = "(min-width: 768px)";

let mql: MediaQueryList | null = null;

function medio() {
  mql ??= window.matchMedia(CONSULTA);
  return mql;
}

function suscribir(avisar: () => void) {
  const m = medio();
  m.addEventListener("change", avisar);
  return () => m.removeEventListener("change", avisar);
}

/**
 * `true` en escritorio, `false` en móvil. **Móvil es la respuesta por defecto.**
 *
 * Existe porque `hidden md:block` esconde con CSS pero no impide nada: un
 * `<img loading="lazy">` dentro de un `display:none` se pide igual. Los
 * televisores estaban montados dos veces —la maqueta de escritorio y la de
 * móvil— y toda visita pedía diez fotos para ver cinco.
 *
 * El `getServerSnapshot` devolvía `null` —"todavía no se sabe"— y `Canales` no
 * pintaba nada mientras lo fuera. La intención era no adivinar el ancho, pero el
 * precio resultó ser el problema entero: **el HTML salía sin una sola imagen**,
 * el `priority` de la primera foto no llegaba a emitir su `<link rel=preload>`,
 * y las fotos no empezaban a bajar hasta después de bajar, ejecutar e hidratar
 * el JavaScript. Cuatro saltos en fila antes de pedir el primer byte de imagen.
 *
 * Así que sí se adivina, y se adivina móvil, que es de donde viene casi todo el
 * tráfico. Escritorio recoloca los mismos marcos al hidratar —comparten `id`, o
 * sea que React los reutiliza y la URL de la imagen no cambia— y para cuando lo
 * hace los televisores todavía están entrando.
 */
export function useEscritorio(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => medio().matches,
    () => false,
  );
}
