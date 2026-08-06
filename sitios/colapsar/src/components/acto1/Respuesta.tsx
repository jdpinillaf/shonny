"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

/**
 * El input se dibuja solo: primero la línea crece de cero a su ancho, y recién
 * después aparecen el texto y el enviar. Es el mismo gesto de la máquina de
 * escribir, pero hecho con una regla.
 */
export function Respuesta({ onEnviar }: { onEnviar: (texto: string) => void }) {
  const [valor, setValor] = useState("");
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // El foco se da después de que la línea terminó de crecer, si no el teclado
    // del móvil salta encima de la animación.
    const t = setTimeout(() => campo.current?.focus(), 1050);
    return () => clearTimeout(t);
  }, []);

  const limpio = valor.trim();
  const puede = limpio.length > 1;

  return (
    <motion.form
      className="mx-auto mt-10 w-full max-w-[540px] md:mt-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (puede) onEnviar(limpio);
      }}
    >
      <div className="relative">
        <input
          ref={campo}
          value={valor}
          onChange={(e) => setValor(e.target.value.slice(0, site.maxRespuesta))}
          placeholder={site.marcador}
          aria-label={site.pregunta}
          enterKeyHint="send"
          autoComplete="off"
          className="w-full bg-transparent pb-3 pr-12 text-center font-mono text-[15px] text-tiza outline-none placeholder:text-humo/55 md:text-base"
        />

        {/* La línea que crece. */}
        <motion.div
          className="absolute bottom-0 left-0 h-px w-full origin-center"
          style={{ background: "rgba(242,240,234,0.42)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.button
          type="submit"
          disabled={!puede}
          aria-label="Enviar"
          className="absolute bottom-2 right-0 font-mono text-lg transition-opacity disabled:cursor-default"
          animate={{ opacity: puede ? 1 : 0.25 }}
          whileHover={puede ? { x: 3 } : undefined}
          transition={{ duration: 0.25 }}
        >
          ↵
        </motion.button>
      </div>

      <motion.div
        className="mt-3 flex items-center justify-between px-0.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <span className="placa text-[7.5px]">nadie va a saber que fuiste vos</span>
        <span className="font-mono text-[10px] text-humo/70 tabular-nums">
          {valor.length}/{site.maxRespuesta}
        </span>
      </motion.div>
    </motion.form>
  );
}
