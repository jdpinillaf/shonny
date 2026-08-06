"use client";

import { motion } from "motion/react";

/**
 * El control del adelanto. Solo dibuja: el audio lo maneja `useSonido`.
 *
 * Va con borde y fondo propio porque queda sobre la pared del museo, y en gris
 * suelto sobre fotos y papeles no lo encuentra nadie — y es lo único que deja
 * oír la canción.
 */
export function Sonido({
  sonando,
  onAlternar,
}: {
  sonando: boolean;
  onAlternar: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onAlternar}
      aria-label={sonando ? "Silenciar el adelanto" : "Escuchar el adelanto"}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 border border-tiza/25 bg-noche/80 px-3.5 py-2 transition-colors hover:border-tiza/60"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 1.6 }}
    >
      <span className="flex h-3.5 items-end gap-[2px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-[2px] bg-tiza"
            animate={sonando ? { height: [4, 13, 6, 11, 4] } : { height: 3 }}
            transition={
              sonando
                ? { duration: 1.05, repeat: Infinity, delay: i * 0.16 }
                : { duration: 0.3 }
            }
          />
        ))}
      </span>
      <span className="font-mono text-[8.5px] uppercase tracking-[0.24em] text-tiza/85">
        {sonando ? "sonando" : "escuchar"}
      </span>
    </motion.button>
  );
}
