"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Pregunta } from "./acto1/Pregunta";
import { Respuesta } from "./acto1/Respuesta";
import { Colapso } from "./acto2/Colapso";
import { Disco } from "./acto3/Disco";
import { Canales } from "./fondo/Canales";
import { MuroNotas } from "./fondo/MuroNotas";
import { Sonido } from "./Sonido";
import { site } from "@/content/site";
import { useSonido } from "@/lib/useSonido";

type Acto = "pregunta" | "colapso" | "disco";

const GUARDADO = "colapsar:respuestas";
const SUAVE = [0.16, 1, 0.3, 1] as const;

export function Museo() {
  const [acto, setActo] = useState<Acto>("pregunta");
  const [inputListo, setInputListo] = useState(false);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [quieto, setQuieto] = useState(false);
  const sonido = useSonido();

  // Las respuestas se leen después del montaje. Si se leyeran durante el render
  // el HTML del servidor y el del cliente no coincidirían.
  useEffect(() => {
    try {
      const crudo = localStorage.getItem(GUARDADO);
      if (crudo) setRespuestas(JSON.parse(crudo));
    } catch {
      // localStorage bloqueado (modo privado): la pared arranca vacía y ya.
    }

    // ?acto=colapso | ?acto=disco entra directo a ese momento. Sirve para
    // revisar el final sin volver a escribir la respuesta cada vez.
    const salto = new URLSearchParams(window.location.search).get("acto");
    if (salto === "colapso" || salto === "disco") setActo(salto);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setQuieto(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  // El audio no se toca acá: `useSonido` ya lo enciende con el primer gesto de
  // la visita, que siempre pasa antes de este envío. Volver a llamarlo acá le
  // reviviría la canción a quien la haya apagado a propósito.
  const enviar = useCallback((texto: string) => {
    setRespuestas((prev) => {
      const siguiente = [...prev, texto].slice(-8);
      try {
        localStorage.setItem(GUARDADO, JSON.stringify(siguiente));
      } catch {}
      return siguiente;
    });
    setActo("colapso");
  }, []);

  const otraVez = useCallback(() => {
    setInputListo(true);
    setActo("pregunta");
  }, []);

  const preguntaLista = useCallback(() => setInputListo(true), []);

  return (
    // El CSS de globals.css apaga los keyframes propios, pero las transiciones
    // de motion viven en JS y no las ve ninguna media query: reducedMotion
    // "user" es lo que las desarma.
    <MotionConfig reducedMotion="user">
      <main className="relative h-dvh w-full overflow-hidden">
        <Canales quieto={quieto} />
        <MuroNotas respuestas={respuestas} quieto={quieto} />

        {/* Rebaja lo que haya detrás justo donde va el texto. Sin esto, una nota
            o un canal claro pueden dejar la pregunta ilegible. Cuando entra el
            disco se afloja: ahí el centro ya no es texto sino la portada a
            color, y el mismo velo que salvaba la lectura le apagaría el momento. */}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20"
          style={{
            background:
              "radial-gradient(58% 44% at 50% 50%, rgba(11,13,12,0.92) 0%, rgba(11,13,12,0.74) 45%, rgba(11,13,12,0) 100%)",
          }}
          animate={{ opacity: acto === "disco" ? 0.5 : 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />

        <div className="relative z-30 flex h-full items-center justify-center px-5">
          <div className="w-full max-w-[860px]">
            <AnimatePresence mode="wait">
              {acto === "pregunta" && (
                <motion.div
                  key="pregunta"
                  exit={{ opacity: 0, y: -26, filter: "blur(5px)" }}
                  transition={{ duration: 0.62, ease: SUAVE }}
                >
                  <Pregunta onListo={preguntaLista} />
                  {inputListo && <Respuesta onEnviar={enviar} />}
                </motion.div>
              )}

              {acto === "colapso" && (
                <motion.div
                  key="colapso"
                  exit={{ opacity: 0, y: -22, filter: "blur(5px)" }}
                  transition={{ duration: 0.55, ease: SUAVE }}
                >
                  <Colapso onListo={() => setActo("disco")} />
                </motion.div>
              )}

              {acto === "disco" && (
                <motion.div key="disco" className="flex justify-center">
                  <Disco onOtraVez={otraVez} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Grano y barrido sobre absolutamente todo, interfaz incluida. */}
        <div
          aria-hidden
          className="grano pointer-events-none fixed inset-0 z-40 opacity-[0.055] mix-blend-overlay"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-40 opacity-[0.16]"
          style={{
            background:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0.5) 4px)",
          }}
        />

        {sonido.hay && (
          <>
            <audio ref={sonido.audio} src={site.audio} loop preload="auto" />
            <Sonido sonando={sonido.sonando} onAlternar={sonido.alternar} />
          </>
        )}
      </main>
    </MotionConfig>
  );
}
