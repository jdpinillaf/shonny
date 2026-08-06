"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

const SUAVE = [0.16, 1, 0.3, 1] as const;
const EMERGER = 1.5; // s que tarda la copia en aparecer en el hueco
const REVELADO = 1.7; // s que tarda en revelarse al enviar

/**
 * El input es una copia instantánea sin revelar.
 *
 * Se renderiza siempre y `listo` controla nada más la aparición. Montarlo
 * recién cuando toca haría crecer el bloque de golpe y, como todo está centrado
 * en vertical, la pregunta pegaría un salto: el desplazamiento del layout no
 * pasa por el motor de animación y ninguna transición lo tapa. Es exactamente
 * el error que costó arreglar en `/rio`.
 *
 * Por lo mismo el `textarea` va con alto fijo de tres líneas desde el primer
 * frame. Nada de crecer con el texto.
 */
export function PapelSinRevelar({
  onEnviar,
  listo,
}: {
  onEnviar: (texto: string) => void;
  listo: boolean;
}) {
  const [valor, setValor] = useState("");
  const [enviado, setEnviado] = useState<string | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);

  const limpio = valor.trim();
  const puede = listo && !enviado && limpio.length > 1;

  useEffect(() => {
    if (!listo) return;
    const t = setTimeout(() => campo.current?.focus(), EMERGER * 1000);
    return () => clearTimeout(t);
  }, [listo]);

  // El aviso al padre espera a que la copia termine de revelarse. Hasta ahí la
  // persona sigue viendo su frase sobre el papel.
  useEffect(() => {
    if (enviado === null) return;
    const t = setTimeout(() => onEnviar(enviado), REVELADO * 1000);
    return () => clearTimeout(t);
  }, [enviado, onEnviar]);

  const revelar = () => {
    if (!puede) return;
    setEnviado(limpio);
  };

  return (
    <motion.form
      className="mx-auto mt-6 w-full max-w-[320px]"
      // Oculto no es solo invisible: tampoco se puede tocar ni tabular hasta él.
      aria-hidden={!listo}
      style={{ pointerEvents: listo ? "auto" : "none" }}
      initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
      animate={
        listo
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y: 30, filter: "blur(15px)" }
      }
      transition={{ duration: EMERGER, ease: SUAVE, delay: listo ? 0.1 : 0 }}
      onSubmit={(e) => {
        e.preventDefault();
        revelar();
      }}
    >
      <div
        className="p-[11px] pb-[13px]"
        style={{
          background: "var(--color-papel)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.72), inset 0 0 0 1px rgba(0,0,0,0.16)",
        }}
      >
        {/* La ventana. Arranca sin exponer y al enviar se revela… vacía. No hay
            foto de eso porque no pasó: lo único que queda es el pie.
            El degradado no es adorno — un negro plano se lee como un agujero
            recortado en la copia, no como papel sin exponer. */}
        <div
          className="relative aspect-[7/5] w-full overflow-hidden"
          style={{
            background: "linear-gradient(147deg, #2a211b 0%, #191310 52%, #221a15 100%)",
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 40%, #cfc9bd 0%, #a8a196 55%, #8b857b 100%)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: enviado ? 1 : 0 }}
            transition={{ duration: REVELADO, ease: "easeOut" }}
          />
          <div
            aria-hidden
            className="grano-papel pointer-events-none absolute inset-0 opacity-[0.2] mix-blend-overlay"
          />
          {/* Brillo del papel: sin esto la ventana se lee como un agujero. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(118deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0) 38%)",
            }}
          />
        </div>

        <div className="pt-2.5">
          <textarea
            ref={campo}
            value={valor}
            rows={3}
            readOnly={!listo || Boolean(enviado)}
            tabIndex={listo ? 0 : -1}
            onChange={(e) =>
              // Los saltos de línea se aplanan: la banda de una copia tiene el
              // alto que tiene, y Enter acá significa enviar.
              setValor(e.target.value.replace(/\s*\n\s*/g, " ").slice(0, site.maxRespuesta))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                revelar();
              }
            }}
            placeholder={site.marcador}
            aria-label={site.pregunta}
            enterKeyHint="send"
            autoComplete="off"
            spellCheck={false}
            className="w-full resize-none overflow-hidden bg-transparent text-center font-mono text-[11.5px] leading-[1.55] outline-none"
            style={{ color: "#211f1b" }}
          />

          <div className="mt-1 flex items-center justify-between">
            <span
              className="font-mono text-[8px] tabular-nums"
              style={{ color: "rgba(33,31,27,0.58)" }}
            >
              {valor.length}/{site.maxRespuesta}
            </span>

            <motion.button
              type="submit"
              disabled={!puede}
              className="font-mono text-[8px] uppercase tracking-[0.24em] disabled:cursor-default"
              style={{ color: "#211f1b" }}
              animate={{ opacity: puede ? 1 : 0.28 }}
              whileHover={puede ? { x: 2 } : undefined}
              transition={{ duration: 0.25 }}
            >
              {enviado ? "revelando…" : "revelar ↵"}
            </motion.button>
          </div>
        </div>
      </div>

      <p className="placa mt-2.5 text-center text-[7.5px]" style={{ color: "var(--color-ceniza)" }}>
        nadie va a saber que fuiste tú
      </p>
    </motion.form>
  );
}
