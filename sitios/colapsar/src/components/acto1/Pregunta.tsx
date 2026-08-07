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

export function Pregunta({ onListo, total }: { onListo: () => void; total: number }) {
  const { escrito, listo } = useTypewriter(site.pregunta, {
    velocidad: 54,
    demora: 900,
  });

  useEffect(() => {
    if (listo) onListo();
  }, [listo, onListo]);

  return (
    <div className="text-center">
      {/* La cifra corona la placa y se lee con ella: "1.200 cosas que nunca
          pasaron". Por eso va en serif y grande y la placa se queda de pie de
          foto: son una sola frase partida en dos cuerpos. */}
      <motion.p
        className="cifra font-serif text-[clamp(2rem,8.5vw,3.4rem)] leading-[1] tracking-[-0.02em]"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {conMiles(total)}
      </motion.p>

      <motion.p
        // `.placa` trae 0.34em de tracking, que a este cuerpo parte el título en
        // dos líneas por debajo de 375px. El clamp y el tracking corto lo
        // sostienen en una sola línea hasta 320px, y en `md` recupera el
        // espaciado de placa de museo.
        className="placa mt-2 text-[clamp(9px,2.6vw,16px)] tracking-[0.22em] md:tracking-[0.34em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, delay: 0.3 }}
      >
        {site.placa}
      </motion.p>

      <h1 className="glow mt-7 font-serif text-[clamp(1.9rem,6.2vw,4.1rem)] leading-[1.12] tracking-[-0.01em] md:mt-9">
        <span>{escrito}</span>
        {!listo && <span className="cursor" aria-hidden />}
      </h1>
    </div>
  );
}
