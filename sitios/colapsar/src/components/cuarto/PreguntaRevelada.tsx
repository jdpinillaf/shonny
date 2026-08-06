"use client";

import { motion } from "motion/react";
import { useEffect } from "react";

/**
 * El texto se revela como una hoja entera, no letra por letra.
 *
 * En una cubeta la imagen no aparece de izquierda a derecha: sube toda junta,
 * primero los medios tonos y al final los negros. Lo de letra por letra ya es
 * lo que hace `/rio`; acá sería la animación equivocada para el gesto.
 *
 * Son dos capas del mismo texto: la de atrás es la imagen latente, una mancha
 * muy desenfocada que se apaga mientras la de adelante enfoca.
 */
export function PreguntaRevelada({
  texto,
  onListo,
  demora = 0,
  duracion = 1.7,
  className = "",
}: {
  texto: string;
  onListo?: () => void;
  demora?: number;
  duracion?: number;
  className?: string;
}) {
  useEffect(() => {
    if (!onListo) return;
    const t = setTimeout(onListo, (demora + duracion) * 1000);
    return () => clearTimeout(t);
  }, [onListo, demora, duracion]);

  return (
    <h1 className={`relative ${className}`} aria-label={texto}>
      <motion.span
        aria-hidden
        className="absolute inset-0 block"
        initial={{ opacity: 0.5, filter: "blur(24px)" }}
        animate={{ opacity: 0, filter: "blur(34px)" }}
        transition={{ duration: duracion * 1.15, delay: demora, ease: "easeOut" }}
      >
        {texto}
      </motion.span>

      {/* Mismas funciones de filter en los dos extremos y en el mismo orden:
          motion interpola función por función y con listas distintas hace un
          corte seco en vez de una transición. */}
      <motion.span
        aria-hidden
        className="relative block"
        initial={{ opacity: 0, filter: "blur(16px) contrast(0.12) brightness(2.3)" }}
        animate={{ opacity: 1, filter: "blur(0px) contrast(1) brightness(1)" }}
        transition={{ duration: duracion, delay: demora, ease: "easeOut" }}
      >
        {texto}
      </motion.span>
    </h1>
  );
}
