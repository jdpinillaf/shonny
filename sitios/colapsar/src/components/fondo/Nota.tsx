"use client";

import { motion } from "motion/react";
import { entre } from "@/lib/semilla";

export type Ranura = { x: string; y: string; movil: boolean };

type Props = {
  texto: string;
  ranura: Ranura;
  /** La que acaba de escribir la persona: entra desde el centro y se queda encendida. */
  nueva?: boolean;
  quieto: boolean;
};

export function Nota({ texto, ranura, nueva = false, quieto }: Props) {
  const semilla = texto;
  const reposo = entre(semilla, -3.4, 3.4, 1);

  return (
    <motion.div
      className="absolute w-[42vw] max-w-[196px] md:w-[184px]"
      style={{ left: ranura.x, top: ranura.y }}
      initial={
        nueva
          ? { opacity: 0, scale: 0.82, x: "-50%", y: 90, filter: "blur(6px)" }
          : { opacity: 0, y: 10 }
      }
      animate={{
        opacity: nueva ? 1 : 0.74,
        scale: 1,
        x: nueva ? "-50%" : 0,
        y: 0,
        filter: "blur(0px)",
      }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.4 } }}
      transition={
        nueva
          ? { duration: 1.1, ease: [0.16, 1, 0.3, 1] }
          : { duration: 1.4, delay: entre(semilla, 0, 1.2, 7), ease: "easeOut" }
      }
    >
      <div
        className="nota relative"
        style={
          {
            "--reposo": `${reposo.toFixed(2)}deg`,
            "--vaiven": quieto ? "0deg" : `${entre(semilla, 0.5, 1.4, 2).toFixed(2)}deg`,
            "--dur": `${entre(semilla, 6, 10, 3).toFixed(1)}s`,
            "--retardo": `-${entre(semilla, 0, 8, 4).toFixed(1)}s`,
          } as React.CSSProperties
        }
      >
        {/* El chinche. Es también el eje del péndulo. */}
        <div
          className="absolute left-1/2 top-0 z-10 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "#8c8377",
            boxShadow: "0 1px 2px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        />

        <div
          className="px-3.5 pb-2.5 pt-4"
          style={{
            background: "var(--color-papel)",
            color: "#22201c",
            // Sombra corta y dura: papel sobre pared, no tarjeta flotando.
            boxShadow: "2px 4px 0 rgba(0,0,0,0.42), 0 14px 30px rgba(0,0,0,0.45)",
          }}
        >
          <p className="text-[11.5px] leading-[1.5] md:text-[12px]">{texto}</p>
          <p
            className="mt-2.5 border-t pt-1.5 text-[7px] tracking-[0.28em] uppercase"
            style={{ borderColor: "rgba(34,32,28,0.22)", color: "rgba(34,32,28,0.5)" }}
          >
            s/f · anónimo · nunca ocurrió
          </p>
        </div>
      </div>
    </motion.div>
  );
}
