"use client";

import { motion } from "motion/react";
import { useEffect } from "react";

/** Dónde toca el agua, en fracción de viewport. Lo comparte la escena. */
export const IMPACTO = { x: 0.5, y: 0.42 };

const DEMORA = 0.55; // s antes de soltarla
const CAIDA = 1.05; // s de caída
const REVIENTE = 0.2; // s de aplastarse contra el agua

/**
 * La gota. Cae, se estira al acelerar y revienta contra la superficie.
 *
 * El estirón vertical durante la caída es lo que la hace leer como agua: una
 * bolita que baja a escala constante parece una pelota.
 */
export function Gota({ onImpacto }: { onImpacto: () => void }) {
  useEffect(() => {
    // El aviso va por reloj, no al terminar la animación: la onda tiene que
    // salir cuando toca el agua, no cuando termina de reventar.
    const t = setTimeout(onImpacto, (DEMORA + CAIDA) * 1000);
    return () => clearTimeout(t);
  }, [onImpacto]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <motion.div
        className="absolute h-2.5 w-2.5 rounded-full"
        style={{
          left: `${IMPACTO.x * 100}%`,
          top: 0,
          marginLeft: -5,
          background: "var(--color-espuma)",
          boxShadow: "0 0 14px rgba(143,182,201,0.8), 0 0 40px rgba(143,182,201,0.35)",
        }}
        initial={{ y: "-6vh", opacity: 0 }}
        animate={{
          y: ["-6vh", `${IMPACTO.y * 100}vh`, `${IMPACTO.y * 100}vh`],
          scaleY: [1, 2.6, 0.2],
          scaleX: [1, 0.72, 2.6],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: CAIDA + REVIENTE,
          delay: DEMORA,
          times: [0, CAIDA / (CAIDA + REVIENTE), 1],
          ease: ["easeIn", "easeOut"],
        }}
      />
    </div>
  );
}
