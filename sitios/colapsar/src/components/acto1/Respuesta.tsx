"use client";

import { motion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/content/site";
import { comprimir, type FotoLista } from "@/lib/comprimir";

export type { FotoLista };

/**
 * El input se dibuja solo: primero la línea crece de cero a su ancho, y recién
 * después aparecen el texto y el enviar. Es el mismo gesto de la máquina de
 * escribir, pero hecho con una regla.
 */
export function Respuesta({
  onEnviar,
}: {
  onEnviar: (texto: string, foto?: FotoLista) => void;
}) {
  const [valor, setValor] = useState("");
  const [foto, setFoto] = useState<FotoLista | null>(null);
  const [cargando, setCargando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const idArchivo = useId();

  useEffect(() => {
    // El foco se da después de que la línea terminó de crecer, si no el teclado
    // del móvil salta encima de la animación.
    const t = setTimeout(() => campo.current?.focus(), 1050);
    return () => clearTimeout(t);
  }, []);

  const limpio = valor.trim();
  const puede = limpio.length > 1 && !cargando;

  const elegir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const elegido = e.target.files?.[0];
    // El input se vacía siempre: si no, elegir la misma foto dos veces seguidas
    // no dispara un segundo `change` y parece que el botón se rompió.
    e.target.value = "";
    if (!elegido) return;
    setCargando(true);
    try {
      setFoto(await comprimir(elegido));
    } catch {
      // Una foto que no se puede leer no vale la pena explicarla: se queda sin
      // adjuntar y la confesión se manda igual.
      setFoto(null);
    } finally {
      setCargando(false);
    }
  };

  return (
    <motion.form
      className="mx-auto mt-10 w-full max-w-[540px] md:mt-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (puede) onEnviar(limpio, foto ?? undefined);
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
        {/* Adjuntar va en placa de museo y no como botón: la foto es opcional y
            no puede competirle al enviar. El input de verdad está escondido —
            el nativo no se deja estilar— y lo dispara el label. */}
        <div className="flex items-center gap-2">
          <input
            ref={archivo}
            id={idArchivo}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={elegir}
            className="sr-only"
          />
          <label
            htmlFor={idArchivo}
            className="placa cursor-pointer text-[7.5px] transition-colors hover:text-tiza"
          >
            {cargando ? "abriendo…" : foto ? "foto adjunta" : "adjuntar foto"}
          </label>
          {foto && (
            <button
              type="button"
              onClick={() => setFoto(null)}
              aria-label="Quitar la foto"
              className="font-mono text-[11px] leading-none text-humo/70 transition-colors hover:text-tiza"
            >
              ×
            </button>
          )}
        </div>

        <span className="font-mono text-[10px] text-humo/70 tabular-nums">
          {valor.length}/{site.maxRespuesta}
        </span>
      </motion.div>
    </motion.form>
  );
}
