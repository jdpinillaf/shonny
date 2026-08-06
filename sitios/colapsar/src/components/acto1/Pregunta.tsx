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
        className="placa text-[9px] md:text-[10px]"
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
