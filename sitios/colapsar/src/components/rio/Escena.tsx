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
  // Antes del impacto no se mueve nada: ni notas, ni cartas con el mouse, ni
  // ondas, ni lluvia de fondo. Todo junto desde el segundo cero se lee como
  // ruido y la gota, que es lo que hay que mirar, se pierde.
  const [caida, setCaida] = useState(false);

  const agua = useRef<AguaApi>(null);
  const puntero = usePuntero(!quieto && caida);
  const sonido = useSonido();
  const encender = sonido.encender;

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(GUARDADO);
      if (crudo) setRespuestas(JSON.parse(crudo));
    } catch {}

    const salto = new URLSearchParams(window.location.search).get("acto");
    if (salto === "pregunta" || salto === "colapso" || salto === "disco") {
      setActo(salto);
      setCaida(true); // saltarse la gota no puede dejar la página congelada
    }
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
    if (quieto || !caida) return;
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
  }, [quieto, caida]);

  const alCaer = useCallback(() => {
    agua.current?.salpicar(IMPACTO.x, IMPACTO.y, 0.95);
    setCaida(true);
    // La canción entra con la gota. Si el navegador la bloquea, `useSonido`
    // deja armado el primer gesto — que además tira otra gota al agua.
    encender();
    setActo("pregunta");
  }, [encender]);

  // El chorrito que rebota vuelve a caer: segundo golpe, más chico.
  const alRebotar = useCallback(() => {
    agua.current?.salpicar(IMPACTO.x, IMPACTO.y, 0.4);
  }, []);

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

  // El agua acusa las dos mitades del remate: la onda de la primera es el
  // texto deshaciéndose, la de la segunda es la card rompiendo la superficie.
  // Sin ellas la transición pasa por encima del río sin tocarlo.
  useEffect(() => {
    if (acto !== "disco") return;
    agua.current?.salpicar(0.5, 0.48, 0.5);
    const t = setTimeout(() => agua.current?.salpicar(0.5, 0.44, 0.62), 1150);
    return () => clearTimeout(t);
  }, [acto]);

  return (
    <MotionConfig reducedMotion="user">
      <main
        className="relative h-dvh w-full overflow-hidden"
        style={{ background: "var(--color-hondo)" }}
      >
        {sinAgua ? (
          <RioSinAgua quieto={quieto} />
        ) : (
          <Agua
            ref={agua}
            quieto={quieto}
            lluvia={caida}
            onSinAgua={() => setSinAgua(true)}
          />
        )}

        {/* Antes de la gota el río está velado: se intuye agua oscura y nada
            más. El impacto destapa el fondo. */}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[5]"
          style={{ background: "var(--color-hondo)" }}
          initial={{ opacity: 0.75 }}
          animate={{ opacity: caida ? 0 : 0.75 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        <NotasFlotando
          respuestas={respuestas}
          puntero={puntero}
          quieto={quieto}
          activo={caida}
          origen={IMPACTO}
        />
        <Causticas quieto={quieto} />

        {acto === "gota" && <Gota onImpacto={alCaer} onRebote={alRebotar} />}

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
                  transition={{ duration: 1.1, ease: "easeIn" }}
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
                    demora={0.5}
                    onListo={() => setInputListo(true)}
                    className="glow mt-7 font-serif text-[clamp(1.9rem,6.2vw,4.1rem)] leading-[1.12] tracking-[-0.01em] md:mt-9"
                  />

                  {/* Se renderiza siempre: montarlo recién al estar listo hacía
                      crecer el bloque de golpe y la pregunta saltaba. */}
                  <InputRio onEnviar={enviar} quieto={quieto} listo={inputListo} />
                </motion.div>
              )}

              {acto === "colapso" && (
                <motion.div
                  key="colapso"
                  // Se hunde, no se va hacia arriba: el texto se diluye en el
                  // agua y de ahí mismo sale después la card.
                  exit={{ opacity: 0, y: 46, filter: "blur(18px)" }}
                  transition={{ duration: 1.2, ease: "easeIn" }}
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
                  <Disco onOtraVez={otraVez} emerge />
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
