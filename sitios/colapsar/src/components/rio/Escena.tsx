"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Disco } from "@/components/acto3/Disco";
import { Sonido } from "@/components/Sonido";
import { site } from "@/content/site";
import { usePuntero } from "@/lib/usePuntero";
import { useSonido } from "@/lib/useSonido";
import { Agua, type AguaApi } from "./agua/Agua";
import { Causticas } from "./Causticas";
import { Gota, IMPACTO } from "./Gota";
import { InputRio } from "./InputRio";
import { NotasFlotando } from "./NotasFlotando";
import { PreguntaEmergente } from "./PreguntaEmergente";
import { RioSinAgua } from "./RioSinAgua";

type Acto = "gota" | "pregunta" | "colapso" | "disco";

const GUARDADO = "colapsar:respuestas";
const SUAVE = [0.16, 1, 0.3, 1] as const;
const MS_ENTRE_ONDAS = 45;

export function Escena() {
  const [acto, setActo] = useState<Acto>("gota");
  const [inputListo, setInputListo] = useState(false);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [quieto, setQuieto] = useState(false);
  const [sinAgua, setSinAgua] = useState(false);

  const agua = useRef<AguaApi>(null);
  const puntero = usePuntero(!quieto);
  const sonido = useSonido();
  const encender = sonido.encender;

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(GUARDADO);
      if (crudo) setRespuestas(JSON.parse(crudo));
    } catch {}

    const salto = new URLSearchParams(window.location.search).get("acto");
    if (salto === "pregunta" || salto === "colapso" || salto === "disco") setActo(salto);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setQuieto(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  // El puntero agita el agua. Limitado por reloj: sin esto un mouse rápido
  // encola cientos de gotas por segundo y la simulación se satura en espuma.
  useEffect(() => {
    if (quieto) return;
    let ultima = 0;

    const mover = (e: PointerEvent) => {
      const t = performance.now();
      if (t - ultima < MS_ENTRE_ONDAS) return;
      ultima = t;
      agua.current?.salpicar(
        e.clientX / window.innerWidth,
        e.clientY / window.innerHeight,
        0.055,
      );
    };
    const tocar = (e: PointerEvent) => {
      agua.current?.salpicar(
        e.clientX / window.innerWidth,
        e.clientY / window.innerHeight,
        0.5,
      );
    };

    window.addEventListener("pointermove", mover, { passive: true });
    window.addEventListener("pointerdown", tocar, { passive: true });
    return () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerdown", tocar);
    };
  }, [quieto]);

  const alCaer = useCallback(() => {
    agua.current?.salpicar(IMPACTO.x, IMPACTO.y, 0.95);
    // La canción entra con la gota. Si el navegador la bloquea, `useSonido`
    // deja armado el primer gesto — que además tira otra gota al agua.
    encender();
    setActo("pregunta");
  }, [encender]);

  const enviar = useCallback((texto: string, pos: { x: number; y: number }) => {
    // La respuesta cae al río donde estaba escrita.
    agua.current?.salpicar(pos.x, pos.y, 0.8);

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

  return (
    <MotionConfig reducedMotion="user">
      <main
        className="relative h-dvh w-full overflow-hidden"
        style={{ background: "var(--color-hondo)" }}
      >
        {sinAgua ? (
          <RioSinAgua quieto={quieto} />
        ) : (
          <Agua ref={agua} quieto={quieto} onSinAgua={() => setSinAgua(true)} />
        )}

        <NotasFlotando respuestas={respuestas} puntero={puntero} quieto={quieto} />
        <Causticas quieto={quieto} />

        {acto === "gota" && <Gota onImpacto={alCaer} />}

        {/* Hunde el fondo justo donde va el texto: sobre una cáustica clara la
            pregunta se pierde. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20"
          style={{
            background:
              "radial-gradient(54% 40% at 50% 48%, rgba(4,9,14,0.86) 0%, rgba(4,9,14,0.6) 50%, rgba(4,9,14,0) 100%)",
          }}
        />

        <div className="relative z-30 flex h-full items-center justify-center px-5">
          <div className="w-full max-w-[880px]">
            <AnimatePresence mode="wait">
              {acto === "pregunta" && (
                <motion.div
                  key="pregunta"
                  className="text-center"
                  exit={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                  transition={{ duration: 0.85, ease: SUAVE }}
                >
                  <motion.p
                    className="placa text-[9px] text-espuma/70 md:text-[10px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.6, delay: 0.5 }}
                  >
                    {site.placa}
                  </motion.p>

                  <PreguntaEmergente
                    texto={site.pregunta}
                    demora={0.25}
                    onListo={() => setInputListo(true)}
                    className="glow mt-7 font-serif text-[clamp(1.9rem,6.2vw,4.1rem)] leading-[1.12] tracking-[-0.01em] md:mt-9"
                  />

                  {inputListo && <InputRio onEnviar={enviar} quieto={quieto} />}
                </motion.div>
              )}

              {acto === "colapso" && (
                <motion.div
                  key="colapso"
                  exit={{ opacity: 0, y: -22, filter: "blur(8px)" }}
                  transition={{ duration: 0.6, ease: SUAVE }}
                >
                  <PreguntaEmergente
                    texto={site.invitacion}
                    demora={0.7}
                    onListo={() => setActo("disco")}
                    className="glow text-center font-serif text-[clamp(1.6rem,5.2vw,3.2rem)] leading-[1.15]"
                  />
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

        {/* Grano fino: iguala el acabado con la landing #1. */}
        <div
          aria-hidden
          className="grano pointer-events-none fixed inset-0 z-40 opacity-[0.05] mix-blend-overlay"
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
