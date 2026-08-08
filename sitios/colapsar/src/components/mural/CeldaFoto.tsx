"use client";

import Image from "next/image";
import { useRef } from "react";
import { type Pieza } from "@/content/pieza";
import { SOMBRA_PARED } from "../fondo/Papel";
import { medir, type Origen } from "../fondo/origen";

/**
 * Una pieza con foto, dentro de la rejilla del mural.
 *
 * En la pared las fotos viven en los televisores y las notas en los papeles.
 * Acá conviven en la misma rejilla, así que la foto necesita su propia celda:
 * misma sombra que el papel para que las dos se lean apoyadas en la misma
 * pared, pero enmarcada y con las líneas de barrido, para que se siga notando
 * que es una pantalla y no un recorte pegado.
 */
export function CeldaFoto({
  pieza,
  reposo,
  onAbrir,
  oculta = false,
}: {
  pieza: Pieza;
  reposo: number;
  onAbrir: (origen: Origen) => void;
  oculta?: boolean;
}) {
  const celda = useRef<HTMLButtonElement>(null);
  if (!pieza.foto) return null;
  const foto = pieza.foto;

  const abrir = () => {
    const el = celda.current;
    if (el) onAbrir(medir(el, pieza, reposo));
  };

  return (
    <button
      ref={celda}
      type="button"
      onClick={abrir}
      aria-label={pieza.texto ? `Abrir pieza: ${pieza.texto}` : "Abrir foto del museo"}
      className="scanlines pointer-events-auto relative block w-full cursor-pointer overflow-hidden"
      style={{
        aspectRatio: `${foto.w} / ${foto.h}`,
        boxShadow: SOMBRA_PARED,
        opacity: oculta ? 0 : 1,
      }}
    >
      <Image
        src={foto.url}
        alt=""
        fill
        sizes="(max-width: 767px) 45vw, 250px"
        className="object-cover"
        style={{ filter: "grayscale(1) contrast(1.16) brightness(0.82)" }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 45%, rgba(11,13,12,0) 40%, rgba(11,13,12,0.6) 100%)",
        }}
      />
    </button>
  );
}
