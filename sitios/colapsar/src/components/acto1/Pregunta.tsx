"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { site } from "@/content/site";
import { useTypewriter } from "@/lib/useTypewriter";

/**
 * La pregunta se teclea. El input no existe hasta que termina de escribirse:
 * primero te preguntan, después te dan dónde contestar.
 */
export function Pregunta({ onListo }: { onListo: () => void }) {
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

      <h1 className="glow mt-7 font-serif text-[clamp(1.9rem,6.2vw,4.1rem)] leading-[1.12] tracking-[-0.01em] md:mt-9">
        <span>{escrito}</span>
        {!listo && <span className="cursor" aria-hidden />}
      </h1>
    </div>
  );
}
