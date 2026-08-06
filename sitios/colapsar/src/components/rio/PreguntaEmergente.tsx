"use client";

import { motion } from "motion/react";
import { useEffect, useMemo } from "react";

const SUAVE = [0.16, 1, 0.3, 1] as const;

/**
 * El texto sale del agua.
 *
 * Cada letra entra desenfocada y desde abajo, pero el orden no es de izquierda
 * a derecha: el retardo es la distancia de la letra al centro de la frase, así
 * la frase se abre desde el punto donde cayó la gota igual que la onda.
 */
export function PreguntaEmergente({
  texto,
  onListo,
  demora = 0,
  className = "",
}: {
  texto: string;
  onListo?: () => void;
  demora?: number;
  className?: string;
}) {
  const letras = useMemo(() => [...texto], [texto]);
  const centro = (letras.length - 1) / 2;
  const paso = 0.055;
  const total = demora + centro * paso + 1.1;

  useEffect(() => {
    if (!onListo) return;
    const t = setTimeout(onListo, total * 1000);
    return () => clearTimeout(t);
  }, [onListo, total]);

  return (
    <h1 className={className} aria-label={texto}>
      {letras.map((l, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 22, filter: "blur(14px)", scale: 1.08 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          transition={{
            duration: 1.1,
            delay: demora + Math.abs(i - centro) * paso,
            ease: SUAVE,
          }}
        >
          {l}
        </motion.span>
      ))}
    </h1>
  );
}
