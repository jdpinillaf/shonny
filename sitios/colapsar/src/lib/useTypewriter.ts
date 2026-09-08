"use client";

import { useEffect, useRef, useState } from "react";

type Opciones = {
  /** ms por caracter, antes del jitter */
  velocidad?: number;
  /** espera antes de la primera letra */
  demora?: number;
  /** mientras sea false no escribe nada */
  activo?: boolean;
};

/**
 * Teclea un texto letra por letra.
 *
 * El jitter por caracter es lo que separa esto de una barra de progreso: una
 * máquina de escribir real no tiene cadencia constante, y las pausas caen más
 * largas después de coma y punto.
 *
 * **Solo para lo que aparece después del primer momento.** El titular del acto
 * 1 se teclea con CSS (`.teclear` en `globals.css`) y no con esto, porque acá
 * el texto arranca vacío y no existe hasta que el navegador hidrata: era el
 * elemento del LCP saliendo en blanco del servidor. El acto 2 sí puede usarlo
 * —para llegar ahí hay que haber enviado una respuesta, o sea que el JavaScript
 * lleva rato corriendo— y a cambio conserva el jitter, que en CSS no hay forma
 * de hacer.
 */
export function useTypewriter(
  texto: string,
  { velocidad = 52, demora = 0, activo = true }: Opciones = {},
) {
  const [n, setN] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!activo) return;

    // Con movimiento reducido el texto aparece completo, sin animación.
    const quieto =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (quieto) {
      setN(texto.length);
      return;
    }

    setN(0);
    let i = 0;

    const paso = () => {
      i += 1;
      setN(i);
      if (i >= texto.length) return;
      const c = texto[i - 1];
      const pausa = c === "," ? 260 : c === "." || c === "?" ? 420 : 0;
      timer.current = setTimeout(paso, velocidad + Math.random() * 46 + pausa);
    };

    timer.current = setTimeout(paso, demora);
    return () => clearTimeout(timer.current);
  }, [texto, velocidad, demora, activo]);

  return { escrito: texto.slice(0, n), listo: n >= texto.length };
}
