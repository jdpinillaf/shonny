"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { entre } from "@/lib/semilla";

export type Ranura = { x: string; y: string };

/**
 * De dónde salió la nota que se abrió: lo que hace falta para mandarla de vuelta
 * a su hueco de la pared cuando se cierre.
 *
 * `cx`/`cy` salen del bounding box, que en un rectángulo rotado sigue estando
 * centrado en el centro del rectángulo. `ancho` no: ese tiene que ser el de
 * layout (`offsetWidth`), porque el del bounding box viene inflado por la
 * inclinación del péndulo.
 */
export type Origen = {
  texto: string;
  cx: number;
  cy: number;
  ancho: number;
  reposo: number;
  boton: HTMLElement | null;
};

/** El pie de museo. Lo comparten la nota de la pared y la nota abierta. */
export const PIE = "anónimo · nos perdimos la oportunidad";

export const PAPEL = {
  tinta: "#22201c",
  borde: "rgba(34,32,28,0.22)",
  pie: "rgba(34,32,28,0.5)",
};

/** Sombra corta y dura: papel sobre pared, no tarjeta flotando. */
export const SOMBRA_PARED = "2px 4px 0 rgba(0,0,0,0.42), 0 14px 30px rgba(0,0,0,0.45)";

type Props = {
  texto: string;
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

export function Nota({
  texto,
  ranura,
  nueva = false,
  quieto,
  puntero,
  onAbrir,
  oculta = false,
}: Props) {
  const semilla = texto;
  const reposo = entre(semilla, -3.4, 3.4, 1);
  const papel = useRef<HTMLButtonElement>(null);

  const abrir = () => {
    const el = papel.current;
    if (!el) return;
    const caja = el.getBoundingClientRect();
    onAbrir({
      texto,
      cx: caja.left + caja.width / 2,
      cy: caja.top + caja.height / 2,
      ancho: el.offsetWidth,
      reposo,
      boton: el,
    });
  };

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

        <button
          ref={papel}
          type="button"
          onClick={abrir}
          aria-label={`Abrir nota: ${texto}`}
          // La pared entera es `pointer-events-none` para no comerse los clicks
          // del centro; el papel se los devuelve solo para sí mismo.
          className="pointer-events-auto block w-full cursor-pointer px-3.5 pb-2.5 pt-4 text-left"
          style={{
            background: "var(--color-papel)",
            color: PAPEL.tinta,
            boxShadow: SOMBRA_PARED,
            // `opacity` y no `visibility`: la nota tiene que seguir siendo
            // enfocable para devolverle el foco al cerrar la grande.
            opacity: oculta ? 0 : 1,
          }}
        >
          <p className="text-[11.5px] leading-[1.5] md:text-[12px]">{texto}</p>
          <p
            className="mt-2.5 border-t pt-1.5 text-[7px] tracking-[0.28em] uppercase"
            style={{ borderColor: PAPEL.borde, color: PAPEL.pie }}
          >
            {PIE}
          </p>
        </button>
      </div>
    </motion.div>
  );
}
