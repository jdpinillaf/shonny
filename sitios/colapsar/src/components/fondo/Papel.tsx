"use client";

import { useRef } from "react";
import { type Pieza } from "@/content/pieza";
import { medir, type Origen } from "./origen";

/**
 * El pie de museo. Lo comparten la pared, el mural y la pieza abierta.
 *
 * La firma va acá y no en `Pieza` porque no es un dato: todas las piezas son
 * anónimas por diseño —no se pide nombre en ningún sitio— y el día que se pida,
 * lo que cambia es el tipo, no esta constante.
 */
export const PIE = "Anónimo — nos perdimos la oportunidad";

export const TINTA = {
  texto: "#22201c",
  borde: "rgba(34,32,28,0.22)",
  pie: "rgba(34,32,28,0.5)",
};

/** Sombra corta y dura: papel sobre pared, no tarjeta flotando. */
export const SOMBRA_PARED = "2px 4px 0 rgba(0,0,0,0.42), 0 14px 30px rgba(0,0,0,0.45)";

type Props = {
  pieza: Pieza;
  /** La inclinación con la que está puesto: la necesita el vuelo para salir derecho. */
  reposo: number;
  onAbrir: (origen: Origen) => void;
  /** Está abierta en grande: se apaga acá para que no se vea dos veces. */
  oculta?: boolean;
  /** Clases del hueco donde vive: la pared lo cuelga, el mural lo mete en una celda. */
  className?: string;
};

/**
 * El papel en sí, sin nada de dónde está colgado.
 *
 * Existe aparte porque la pared y el mural pintan el mismo papel en sitios muy
 * distintos —uno absoluto y colgando de un chinche, el otro en una rejilla— y el
 * fondo, la tinta y el pie son justo lo que se desincroniza a la tercera vez que
 * se toca el copy.
 */
export function Papel({ pieza, reposo, onAbrir, oculta = false, className = "" }: Props) {
  const papel = useRef<HTMLButtonElement>(null);

  const abrir = () => {
    const el = papel.current;
    if (el) onAbrir(medir(el, pieza, reposo));
  };

  return (
    <button
      ref={papel}
      type="button"
      onClick={abrir}
      aria-label={pieza.texto ? `Abrir nota: ${pieza.texto}` : "Abrir pieza del museo"}
      className={`pointer-events-auto block w-full cursor-pointer px-3.5 pb-2.5 pt-4 text-left ${className}`}
      style={{
        background: "var(--color-papel)",
        color: TINTA.texto,
        boxShadow: SOMBRA_PARED,
        // `opacity` y no `visibility`: la nota tiene que seguir siendo enfocable
        // para devolverle el foco al cerrar la grande.
        opacity: oculta ? 0 : 1,
      }}
    >
      <p className="text-[11.5px] leading-[1.5] md:text-[12px]">{pieza.texto}</p>
      <p
        // Tracking más corto que el del modal: acá el papel mide 184px y con
        // 0.28em el pie se parte en tres líneas en vez de dos.
        className="mt-2.5 border-t pt-1.5 text-[7px] tracking-[0.18em] uppercase"
        style={{ borderColor: TINTA.borde, color: TINTA.pie }}
      >
        {PIE}
      </p>
    </button>
  );
}
