"use client";

import { Pieza } from "./Pieza";
import { ANCHA, ESTRECHA, PIEZAS_ANCHA, PIEZAS_ESTRECHA, type Pieza as Dato } from "./piezas";

/**
 * La pared.
 *
 * Dos rejillas, una por ancho de pantalla, y solo una montada a la vez vía CSS.
 * La que está en `display:none` no descarga sus imágenes: las de Next van en
 * lazy y un elemento oculto nunca entra en viewport, así que no se paga el
 * ancho de banda de la rejilla que no se ve.
 */
export function Mosaico({
  respuesta,
  quieto,
}: {
  /** Lo último que escribió la persona. Cae en la pieza marcada como buzón. */
  respuesta?: string;
  quieto: boolean;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[2]">
      <Rejilla
        piezas={PIEZAS_ANCHA}
        rejilla={ANCHA}
        respuesta={respuesta}
        quieto={quieto}
        className="hidden md:grid"
      />
      <Rejilla
        piezas={PIEZAS_ESTRECHA}
        rejilla={ESTRECHA}
        respuesta={respuesta}
        quieto={quieto}
        className="grid md:hidden"
      />
    </div>
  );
}

function Rejilla({
  piezas,
  rejilla,
  respuesta,
  quieto,
  className,
}: {
  piezas: Dato[];
  rejilla: typeof ANCHA;
  respuesta?: string;
  quieto: boolean;
  className: string;
}) {
  return (
    <div
      className={`${className} h-full w-full gap-[3px] p-[3px]`}
      style={{
        gridTemplateColumns: `repeat(${rejilla.cols}, 1fr)`,
        gridTemplateRows: `repeat(${rejilla.filas}, 1fr)`,
      }}
    >
      {piezas.map((p) => {
        const suya = Boolean(p.buzon && respuesta);
        return (
          <Pieza
            // La clave lleva el texto: cuando llega una respuesta nueva el
            // buzón se remonta y su `@keyframes` vuelve a correr desde cero.
            // Sin esto la pieza cambiaría de texto sin revelarse.
            key={suya ? `${p.id}-${respuesta}` : p.id}
            pieza={suya ? { ...p, texto: respuesta as string } : p}
            quieto={quieto}
            propia={suya}
          />
        );
      })}
    </div>
  );
}
