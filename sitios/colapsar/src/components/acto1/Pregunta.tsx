"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { site } from "@/content/site";
import { useTypewriter } from "@/lib/useTypewriter";

/**
 * La pregunta se teclea. El input no existe hasta que termina de escribirse:
 * primero te preguntan, después te dan dónde contestar.
 */
/**
 * Sin `toLocaleString`: el separador de miles depende del locale del entorno, y
 * el del servidor no tiene por qué ser el del navegador. Un "1.200" contra un
 * "1,200" es una discrepancia de hidratación por un punto.
 */
function conMiles(n: number) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function Pregunta({
  onListo,
  total,
  muralAbierto,
  onAbrirMural,
}: {
  onListo: () => void;
  total: number;
  muralAbierto: boolean;
  onAbrirMural: () => void;
}) {
  const { escrito, listo } = useTypewriter(site.pregunta, {
    velocidad: 54,
    demora: 900,
  });

  useEffect(() => {
    if (listo) onListo();
  }, [listo, onListo]);

  return (
    <div className="text-center">
      <motion.p
        // `.placa` trae 0.34em de tracking, que a este cuerpo parte el título en
        // dos líneas por debajo de 375px. El clamp y el tracking corto lo
        // sostienen en una sola línea hasta 320px, y en `md` recupera el
        // espaciado de placa de museo.
        className="placa text-[clamp(9px,2.6vw,16px)] tracking-[0.22em] md:tracking-[0.34em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.3 }}
      >
        {site.placa}
      </motion.p>

      {/* El recuento, debajo de la placa. La cifra va en serif y grande y el
          resto de la frase pequeño al lado: es lo que la separa de un dato de
          pie de página y hace que se mire.

          Es la única puerta al mural, pero no se dibuja como botón: sin borde y
          sin fondo. Lo que dice que está vivo es la luz que lo recorre —el
          `.cifra` de globals.css— y que se enciende del todo al pasar por
          encima. */}
      <motion.button
        type="button"
        onClick={onAbrirMural}
        aria-haspopup="dialog"
        aria-expanded={muralAbierto}
        className="cifra mx-auto mt-3 flex cursor-pointer items-baseline justify-center gap-2 font-serif transition-opacity hover:opacity-100 md:opacity-90"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="text-[clamp(1.7rem,6.4vw,2.8rem)] leading-[1] tracking-[-0.02em]">
          {conMiles(total)}
        </span>
        <span className="text-[clamp(0.72rem,2.5vw,1.05rem)] leading-[1]">
          {site.recuento}
        </span>
      </motion.button>

      <h1 className="glow mt-7 font-serif text-[clamp(1.9rem,6.2vw,4.1rem)] leading-[1.12] tracking-[-0.01em] md:mt-9">
        <span>{escrito}</span>
        {!listo && <span className="cursor" aria-hidden />}
      </h1>
    </div>
  );
}
