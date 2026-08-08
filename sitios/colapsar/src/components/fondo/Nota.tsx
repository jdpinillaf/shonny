"use client";

import { motion } from "motion/react";
import { type Pieza } from "@/content/pieza";
import { entre } from "@/lib/semilla";
import { Papel } from "./Papel";
import { type Origen } from "./origen";

export type Ranura = { x: string; y: string };

type Props = {
  pieza: Pieza;
  ranura: Ranura;
  /** La que acaba de escribir la persona: entra desde el centro y se queda encendida. */
  nueva?: boolean;
  quieto: boolean;
  /** Hay un puntero de verdad, no un dedo. */
  puntero: boolean;
  onAbrir: (origen: Origen) => void;
  /** Está abierta en grande: se apaga acá para que no se vea dos veces. */
  oculta?: boolean;
};

/** El papel colgado de la pared: su ranura, su chinche y su péndulo. */
export function Nota({
  pieza,
  ranura,
  nueva = false,
  quieto,
  puntero,
  onAbrir,
  oculta = false,
}: Props) {
  // La semilla es el id y no el texto: dos personas escriben lo mismo y sus dos
  // notas colgarían con la misma inclinación y el mismo vaivén, que es justo el
  // tipo de coincidencia que se lee como error.
  const semilla = pieza.id;
  const reposo = entre(semilla, -3.4, 3.4, 1);

  return (
    <motion.div
      className="pointer-events-none absolute w-[42vw] max-w-[196px] md:w-[184px]"
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
      // Solo con puntero: en táctil el toque cuenta como hover y se queda
      // pegado, así que la nota se quedaría encendida y un pelo más grande
      // después de cerrarla.
      whileHover={puntero ? { opacity: 1, scale: 1.035 } : undefined}
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
          aria-hidden
          className="absolute left-1/2 top-0 z-10 h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "#8c8377",
            boxShadow: "0 1px 2px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        />

        <Papel pieza={pieza} reposo={reposo} onAbrir={onAbrir} oculta={oculta} />
      </div>
    </motion.div>
  );
}
