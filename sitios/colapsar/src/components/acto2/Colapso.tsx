"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { site } from "@/content/site";
import { useTypewriter } from "@/lib/useTypewriter";

/**
 * El puente. Se teclea la invitación y, un respiro después, entra el disco.
 */
export function Colapso({ onListo }: { onListo: () => void }) {
  const { escrito, listo } = useTypewriter(site.invitacion, {
    velocidad: 62,
    demora: 620,
  });

  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(onListo, 760);
    return () => clearTimeout(t);
  }, [listo, onListo]);

  return (
    <motion.p
      className="glow text-center font-serif text-[clamp(1.6rem,5.2vw,3.2rem)] leading-[1.15]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {escrito}
      {!listo && <span className="cursor" aria-hidden />}
    </motion.p>
  );
}
