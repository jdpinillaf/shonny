"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { BARAJA } from "@/content/coleccion";
import { site } from "@/content/site";
import { entre } from "@/lib/semilla";
import { NotaAbierta } from "../fondo/NotaAbierta";
import { Papel, type Origen } from "../fondo/Papel";

const SUAVE = [0.16, 1, 0.3, 1] as const;

/**
 * La colección entera, en rejilla.
 *
 * Se entra hundiendo el recuento. Dos columnas en móvil y cuatro desde `md`, con
 * el alto recortado para que se vean unas tres filas y el resto se alcance
 * scrolleando: la gracia es que se note que hay más de lo que cabe.
 *
 * Las respuestas de la persona van primero, lo último arriba del todo. Después
 * la colección barajada.
 */
export function Mural({
  respuestas,
  onCerrar,
}: {
  respuestas: string[];
  onCerrar: () => void;
}) {
  const cerrar = useRef<HTMLButtonElement>(null);

  // Igual que en la pared: `abierta` monta la nota grande y `hueco` apaga la
  // celda, y el hueco no se limpia hasta que termina el vuelo de vuelta. Con uno
  // solo, la nota se ve dos veces mientras vuelve.
  const [abierta, setAbierta] = useState<Origen | null>(null);
  const [hueco, setHueco] = useState<Origen | null>(null);

  const piezas = [...respuestas].reverse().concat(BARAJA.filter((t) => !respuestas.includes(t)));

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      // El Escape es de la nota abierta mientras haya una: cerrar la nota no
      // puede cerrar el mural que hay detrás.
      if (e.key === "Escape" && !abierta) onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar, abierta]);

  useEffect(() => {
    cerrar.current?.focus();
  }, []);

  const abrir = (origen: Origen) => {
    setAbierta(origen);
    setHueco(origen);
  };

  const volvioASuSitio = () => {
    hueco?.boton?.focus();
    setHueco(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={site.placa}
      // Entre el contenido (z-30) y la película (z-40): el grano y el barrido van
      // sobre absolutamente todo, el mural incluido.
      className="fixed inset-0 z-[35]"
    >
      {/* Sin `backdrop-filter`: filtrar el viewport entero mientras algo se mueve
          encima es lo más caro que puede hacer esta pantalla. El negro tapa. */}
      <motion.div
        className="absolute inset-0 bg-noche/92"
        onClick={onCerrar}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      <div className="pointer-events-none absolute inset-0 grid place-items-center px-4">
        <motion.div
          className="pointer-events-auto w-[min(94vw,1100px)]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10, transition: { duration: 0.3 } }}
          transition={{ duration: 0.55, ease: SUAVE }}
        >
          <div className="relative mb-4 text-center">
            <p className="placa text-[9px] tracking-[0.24em] md:text-[11px] md:tracking-[0.34em]">
              {site.placa}
            </p>
            <p className="mt-2 font-mono text-[10px] text-humo/70 md:text-[11px]">
              {piezas.length} {site.recuento}
            </p>

            <button
              ref={cerrar}
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar el mural"
              className="absolute -top-1 right-0 h-8 w-8 cursor-pointer font-mono text-[18px] leading-none text-tiza/55 transition-colors hover:text-tiza"
            >
              ×
            </button>
          </div>

          {/* El alto está cortado a propósito para que se vean unas tres filas en
              móvil y tres o cuatro en escritorio: si cupiera todo, el mural
              dejaría de parecer que tiene fondo y no habría nada que explorar.

              `overscroll-contain` no es opcional: `body` tiene `overflow: hidden`
              y sin esto el scroll que llega al final se lo lleva la página. */}
          <div className="max-h-[46vh] overflow-y-auto overscroll-contain pb-2 pr-1 md:max-h-[56vh]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
              {piezas.map((texto, i) => (
                <motion.div
                  key={texto}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  // Escalonado corto y con techo: con la colección entera, un
                  // retardo por índice sin tope dejaría las últimas entrando
                  // varios segundos después.
                  transition={{ duration: 0.5, delay: Math.min(i * 0.03, 0.5), ease: SUAVE }}
                >
                  <Papel
                    texto={texto}
                    // Acá no cuelga de un chinche, pero una inclinación chica y
                    // estable es lo que separa la rejilla de una tabla.
                    reposo={entre(texto, -1.5, 1.5, 9)}
                    onAbrir={abrir}
                    oculta={hueco?.texto === texto}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dentro del mural y no al lado: los dos viven en z-[35], y entre hermanos
          del mismo z manda el orden del DOM. */}
      <AnimatePresence onExitComplete={volvioASuSitio}>
        {abierta && (
          <NotaAbierta key={abierta.texto} origen={abierta} onCerrar={() => setAbierta(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
