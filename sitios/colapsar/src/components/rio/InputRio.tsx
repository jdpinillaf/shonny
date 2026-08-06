"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

/** Ocho medias ondas: el patrón se repite cada 50 unidades y cierra en 400. */
const ONDA = `M0 8 ${"q 12.5 -5 25 0 q 12.5 5 25 0 ".repeat(8)}`;

const SUAVE = [0.16, 1, 0.3, 1] as const;
const EMERGER = 1.6; // s que tarda en salir del agua

/**
 * El input es el río: se escribe sobre una línea que corre.
 *
 * Se renderiza siempre, incluso antes de estar listo, y `listo` controla nada
 * más la aparición. Montarlo recién cuando toca hacía crecer el bloque de
 * golpe y, como todo está centrado en vertical, la pregunta pegaba un salto de
 * medio centenar de píxeles en un solo frame. Ninguna animación tapa eso: el
 * desplazamiento del layout no pasa por el motor de animación.
 *
 * Las tres piezas entran escalonadas — primero la línea, después el campo,
 * después el pie — para que nada aparezca de una.
 */
export function InputRio({
  onEnviar,
  quieto,
  listo,
}: {
  onEnviar: (texto: string, pos: { x: number; y: number }) => void;
  quieto: boolean;
  listo: boolean;
}) {
  const [valor, setValor] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listo) return;
    // El foco va al final de la aparición. Antes saltaba a los 900ms, con el
    // campo todavía formándose: se veía el cursor titilando sobre la nada.
    const t = setTimeout(() => campo.current?.focus(), EMERGER * 1000);
    return () => clearTimeout(t);
  }, [listo]);

  const limpio = valor.trim();
  const puede = listo && limpio.length > 1;

  return (
    <motion.form
      className="mx-auto mt-11 w-full max-w-[560px]"
      // Sin `listo` no es solo invisible: no se puede tocar ni tabular hasta él.
      aria-hidden={!listo}
      style={{ pointerEvents: listo ? "auto" : "none" }}
      initial={{ opacity: 0, y: 26, filter: "blur(14px)" }}
      animate={
        listo
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 26, filter: "blur(14px)" }
      }
      transition={{ duration: EMERGER, ease: SUAVE, delay: listo ? 0.15 : 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!puede) return;
        const r = caja.current?.getBoundingClientRect();
        onEnviar(
          limpio,
          r
            ? {
                x: (r.left + r.width / 2) / window.innerWidth,
                y: (r.top + r.height / 2) / window.innerHeight,
              }
            : { x: 0.5, y: 0.55 },
        );
      }}
    >
      <div ref={caja} className="relative">
        <motion.input
          ref={campo}
          value={valor}
          onChange={(e) => setValor(e.target.value.slice(0, site.maxRespuesta))}
          placeholder={site.marcador}
          aria-label={site.pregunta}
          enterKeyHint="send"
          autoComplete="off"
          tabIndex={listo ? 0 : -1}
          readOnly={!listo}
          className="w-full bg-transparent pb-4 pr-12 text-center font-mono text-[15px] text-tiza outline-none placeholder:text-espuma/45 md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: listo ? 1 : 0 }}
          transition={{ duration: 1.1, ease: "easeOut", delay: listo ? 0.6 : 0 }}
        />

        {/* La corriente. Crece a lo ancho antes de empezar a correr. */}
        <motion.div
          className="absolute bottom-0 left-0 h-4 w-full origin-center overflow-hidden"
          initial={{ opacity: 0, scaleX: 0.6 }}
          animate={{ opacity: listo ? 1 : 0, scaleX: listo ? 1 : 0.6 }}
          transition={{ duration: 1.3, ease: SUAVE, delay: listo ? 0.2 : 0 }}
        >
          <motion.svg
            className="h-4 w-[200%]"
            viewBox="0 0 400 16"
            preserveAspectRatio="none"
            fill="none"
            animate={quieto || !listo ? undefined : { x: ["0%", "-50%"] }}
            transition={{ duration: 9, ease: "linear", repeat: Infinity }}
          >
            <path
              d={ONDA}
              stroke="var(--color-espuma)"
              strokeOpacity="0.7"
              strokeWidth="1.4"
            />
          </motion.svg>
        </motion.div>

        <motion.button
          type="submit"
          disabled={!puede}
          aria-label="Enviar"
          tabIndex={listo ? 0 : -1}
          className="absolute bottom-3 right-0 font-mono text-lg text-tiza transition-opacity disabled:cursor-default"
          animate={{ opacity: puede ? 1 : 0.25 }}
          whileHover={puede ? { x: 3 } : undefined}
          transition={{ duration: 0.25 }}
        >
          ↵
        </motion.button>
      </div>

      <motion.div
        className="mt-4 flex items-center justify-between px-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: listo ? 1 : 0 }}
        transition={{ duration: 1.1, ease: "easeOut", delay: listo ? 1 : 0 }}
      >
        <span className="placa text-[7.5px] text-espuma/60">
          nadie va a saber que fuiste tú
        </span>
        <span className="font-mono text-[10px] tabular-nums text-espuma/60">
          {valor.length}/{site.maxRespuesta}
        </span>
      </motion.div>
    </motion.form>
  );
}
