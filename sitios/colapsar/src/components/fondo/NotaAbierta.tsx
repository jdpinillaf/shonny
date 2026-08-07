"use client";

import { motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { PAPEL, PIE, type Origen } from "./Nota";

/** Arranca lento: la nota se despega antes de viajar, sin quedarse quieta. */
const DESPEGUE = [0.5, 0, 0.25, 1] as const;
const ASENTAR = [0.22, 1, 0.28, 1] as const;
const ENDEREZAR = [0.33, 1, 0.5, 1] as const;
const CRECER = [0.16, 1, 0.3, 1] as const;

/**
 * Ya no está apoyada en la pared: sombra larga y difusa, de objeto en el aire.
 * Fija, no interpolada: animar un blur de 90px repinta la sombra entera en cada
 * fotograma y es lo primero que se nota cuando el vuelo se atasca. Fija sale
 * gratis y encima queda bien en los dos extremos, porque la escala se la
 * encoge sola mientras la nota todavía es del tamaño de la pared.
 */
const SOMBRA_AIRE = "0 3px 0 rgba(0,0,0,0.18), 0 44px 90px rgba(0,0,0,0.7)";

const CAJA = "pointer-events-auto relative w-[min(86vw,440px)] px-7 pb-6 pt-8";

type Vuelo = { dx: number; dy: number; s: number };

/**
 * La nota despegada de la pared.
 *
 * El vuelo es un FLIP a mano en vez de un `layoutId`: la nota de la pared cuelga
 * de la animación CSS `colgar`, y una animación de layout mediría el bounding
 * box ya inclinado y entraría con un salto. Acá el ángulo se conoce de antemano
 * —lo trae `origen.reposo`— y se anima a cero explícitamente. Todo son
 * transforms: nada de animar `width` ni `top`.
 */
export function NotaAbierta({
  origen,
  onCerrar,
}: {
  origen: Origen;
  onCerrar: () => void;
}) {
  const medidor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const [vuelo, setVuelo] = useState<Vuelo | null>(null);

  // Primer pase: la nota grande se pinta en su sitio del centro pero invisible,
  // se mide, y de ahí sale el transform que la manda de vuelta al hueco de la
  // pared. Va en `useLayoutEffect` y no en `useEffect` porque el resultado tiene
  // que estar puesto antes del primer pintado; si no, se cuela un fotograma con
  // la nota ya centrada.
  useLayoutEffect(() => {
    const el = medidor.current;
    if (!el) return;
    const destino = el.getBoundingClientRect();
    setVuelo({
      dx: origen.cx - (destino.left + destino.width / 2),
      dy: origen.cy - (destino.top + destino.height / 2),
      s: origen.ancho / destino.width,
    });
  }, [origen]);

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  useEffect(() => {
    if (vuelo) boton.current?.focus();
  }, [vuelo]);

  const cuerpo = (
    <>
      {/* El chinche viaja con ella: sigue siendo la misma nota. */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "#8c8377",
          boxShadow: "0 1px 3px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      />

      <button
        ref={boton}
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar nota"
        className="absolute right-3 top-3 h-7 w-7 cursor-pointer font-mono text-[17px] leading-none opacity-55 transition-opacity hover:opacity-100"
        style={{ color: PAPEL.tinta }}
      >
        ×
      </button>

      <p className="text-[17px] leading-[1.6] md:text-[19px]">{origen.texto}</p>
      <p
        className="mt-5 border-t pt-3 text-[8.5px] uppercase tracking-[0.28em]"
        style={{ borderColor: PAPEL.borde, color: PAPEL.pie }}
      >
        {PIE}
      </p>
    </>
  );

  const fondoPapel = {
    background: "var(--color-papel)",
    color: PAPEL.tinta,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nota del museo"
      // Entre el contenido (z-30) y la película (z-40): el grano y el barrido
      // van sobre absolutamente todo, la nota abierta incluida.
      className="fixed inset-0 z-[35]"
    >
      {/* Sin `backdrop-filter`: filtrar el viewport entero mientras algo grande
          se mueve encima es lo más caro que puede hacer esta pantalla, y lo que
          le quita fluidez al vuelo. El negro plano tapa igual. */}
      <motion.div
        className="absolute inset-0 bg-noche/88"
        onClick={onCerrar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      />

      <div className="pointer-events-none absolute inset-0 grid place-items-center px-5">
        {vuelo === null ? (
          <div ref={medidor} className={CAJA} style={{ ...fondoPapel, visibility: "hidden" }}>
            {cuerpo}
          </div>
        ) : (
          <motion.div
            className={CAJA}
            style={{ ...fondoPapel, boxShadow: SOMBRA_AIRE, willChange: "transform" }}
            initial={{ x: vuelo.dx, y: vuelo.dy, scale: vuelo.s, rotate: origen.reposo }}
            // Cada propiedad con su propio tiempo, sin tramos ni esperas: el
            // despegue no es una pausa antes del viaje, es el viaje arrancando
            // lento mientras la nota se endereza y crece. Nada se queda quieto
            // en ningún momento, que es lo que se leía como tirón.
            animate={{
              x: 0,
              // El único salto real: se levanta de la pared antes de caer al
              // centro. Como es en `y`, sale del mismo movimiento continuo.
              y: [vuelo.dy, vuelo.dy - 14, 0],
              scale: 1,
              rotate: 0,
            }}
            exit={{
              x: vuelo.dx,
              y: vuelo.dy,
              scale: vuelo.s,
              rotate: origen.reposo,
              transition: { duration: 0.52, ease: [0.4, 0, 0.25, 1] },
            }}
            transition={{
              x: { duration: 0.82, ease: DESPEGUE },
              y: { duration: 0.82, times: [0, 0.2, 1], ease: ["easeOut", ASENTAR] },
              scale: { duration: 0.86, ease: CRECER },
              rotate: { duration: 0.58, ease: ENDEREZAR },
            }}
          >
            {cuerpo}
          </motion.div>
        )}
      </div>
    </div>
  );
}
