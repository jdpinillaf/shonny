"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

/** Ocho medias ondas: el patrón se repite cada 50 unidades y cierra en 400. */
const ONDA = `M0 8 ${"q 12.5 -5 25 0 q 12.5 5 25 0 ".repeat(8)}`;

/**
 * El input es el río: se escribe sobre una línea que corre.
 *
 * El SVG mide el doble del contenedor y se desplaza justo media vuelta, así el
 * patrón vuelve a caer en fase y la corriente no da tirones al reiniciar.
 */
export function InputRio({
  onEnviar,
  quieto,
}: {
  onEnviar: (texto: string, pos: { x: number; y: number }) => void;
  quieto: boolean;
}) {
  const [valor, setValor] = useState("");
  const campo = useRef<HTMLInputElement>(null);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => campo.current?.focus(), 900);
    return () => clearTimeout(t);
  }, []);

  const limpio = valor.trim();
  const puede = limpio.length > 1;

  return (
    <motion.form
      className="mx-auto mt-11 w-full max-w-[560px]"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
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
        <input
          ref={campo}
          value={valor}
          onChange={(e) => setValor(e.target.value.slice(0, site.maxRespuesta))}
          placeholder={site.marcador}
          aria-label={site.pregunta}
          enterKeyHint="send"
          autoComplete="off"
          className="w-full bg-transparent pb-4 pr-12 text-center font-mono text-[15px] text-tiza outline-none placeholder:text-espuma/45 md:text-base"
        />

        <div className="absolute bottom-0 left-0 h-4 w-full overflow-hidden">
          <motion.svg
            className="h-4 w-[200%]"
            viewBox="0 0 400 16"
            preserveAspectRatio="none"
            fill="none"
            animate={quieto ? undefined : { x: ["0%", "-50%"] }}
            transition={{ duration: 9, ease: "linear", repeat: Infinity }}
          >
            <path d={ONDA} stroke="var(--color-espuma)" strokeOpacity="0.7" strokeWidth="1.4" />
          </motion.svg>
        </div>

        <motion.button
          type="submit"
          disabled={!puede}
          aria-label="Enviar"
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
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
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
