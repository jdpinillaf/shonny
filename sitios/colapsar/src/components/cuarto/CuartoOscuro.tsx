"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { Disco } from "@/components/acto3/Disco";
import { Sonido } from "@/components/Sonido";
import { site } from "@/content/site";
import { useSonido } from "@/lib/useSonido";
import { Mosaico } from "./Mosaico";
import { PapelSinRevelar } from "./PapelSinRevelar";
import { PreguntaRevelada } from "./PreguntaRevelada";
import { Safelight } from "./Safelight";

type Acto = "pregunta" | "colapso" | "disco";

const GUARDADO = "colapsar:respuestas";

/** Cuánto espera la pregunta a que la pared termine de revelarse. */
const ESPERA = 2.4;
const REVELADO_TEXTO = 1.7;

export function CuartoOscuro() {
  const [acto, setActo] = useState<Acto>("pregunta");
  const [inputListo, setInputListo] = useState(false);
  const [respuestas, setRespuestas] = useState<string[]>([]);
  const [quieto, setQuieto] = useState(false);
  // La segunda vuelta no vuelve a esperar a la pared: ya está revelada.
  const [vista, setVista] = useState(false);

  const sonido = useSonido();

  useEffect(() => {
    try {
      const crudo = localStorage.getItem(GUARDADO);
      if (crudo) setRespuestas(JSON.parse(crudo));
    } catch {
      // localStorage bloqueado (modo privado): la pared arranca sin respuesta.
    }

    const salto = new URLSearchParams(window.location.search).get("acto");
    if (salto === "colapso" || salto === "disco") {
      setActo(salto);
      setVista(true);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const leer = () => setQuieto(mq.matches);
    leer();
    mq.addEventListener("change", leer);
    return () => mq.removeEventListener("change", leer);
  }, []);

  const preguntaLista = useCallback(() => {
    setInputListo(true);
    setVista(true);
  }, []);

  // El audio no se toca acá: `useSonido` ya lo arranca al entrar y, si el
  // navegador lo bloquea, con el primer gesto. Encenderlo de nuevo le reviviría
  // la canción a quien la haya apagado a propósito.
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

  // La espera larga existe para dejar que la pared se revele. Con movimiento
  // reducido no hay revelado que esperar: la pared ya está puesta y quedarse
  // cuatro segundos mirando una página quieta antes de que aparezca el input no
  // es una animación más suave, es una página rota.
  const demora = quieto ? 0.2 : vista ? 0.25 : ESPERA;

  return (
    <MotionConfig reducedMotion="user">
      <main
        className="relative h-dvh w-full overflow-hidden"
        style={{ background: "var(--color-cuarto)" }}
      >
        {/* La pared de verdad, debajo de todo. Sin esto el hueco del centro se
            lee como un agujero recortado en la pantalla y no como el pedazo de
            muro donde nadie pegó nada. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            // Dos capas: el muro entero, y un charco de luz en el centro. El
            // charco solo se ve en el hueco —el resto está tapado por las
            // piezas— y es lo que hace que el centro se lea como pared
            // iluminada y no como el fondo de la pantalla.
            background:
              "radial-gradient(94% 84% at 50% 44%, #3d2a21 0%, #2a1c16 48%, rgba(42,28,22,0) 100%), radial-gradient(128% 96% at 50% -6%, #2b1d17 0%, #1b120e 42%, #100a08 74%, #0a0605 100%)",
          }}
        />
        <div
          aria-hidden
          className="grano-papel pointer-events-none fixed inset-0 z-[1] opacity-[0.16] mix-blend-overlay"
        />

        <Mosaico respuesta={respuestas.at(-1)} quieto={quieto} />
        <Safelight quieto={quieto} atenuado={acto === "disco"} />

        {/* Hunde la pared donde va el texto. Es más ancho que el hueco a
            propósito: al desbordar sobre las piezas vecinas, el borde recto que
            deja la rejilla deja de leerse como un recorte con tijera.
            En el disco se agranda: ese bloque es más alto que el hueco —card,
            título, nombre, dos enlaces— y sin esto el botón del final queda
            sentado encima de una nota del pie. */}
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-20"
          style={{
            background:
              "radial-gradient(60% 54% at 50% 50%, rgba(8,5,4,0.78) 0%, rgba(8,5,4,0.56) 56%, rgba(8,5,4,0) 100%)",
          }}
          animate={{ scale: acto === "disco" ? 1.4 : 1 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
        />

        <div className="relative z-30 flex h-full items-center justify-center px-5">
          <div className="w-full max-w-[420px] md:max-w-[min(52vw,760px)]">
            <AnimatePresence mode="wait">
              {acto === "pregunta" && (
                <motion.div
                  key="pregunta"
                  className="text-center"
                  // Se va hacia arriba y encogiendo: la copia se despega del
                  // centro y se va a pegar a la pared.
                  exit={{ opacity: 0, y: -84, scale: 0.74, filter: "blur(8px)" }}
                  transition={{ duration: 1, ease: "easeIn" }}
                >
                  <motion.p
                    className="placa text-[9px] md:text-[10px]"
                    style={{ color: "var(--color-ceniza)" }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.6, delay: Math.max(0, demora - 0.6) }}
                  >
                    {site.placa}
                  </motion.p>

                  <PreguntaRevelada
                    texto={site.pregunta}
                    demora={demora}
                    duracion={REVELADO_TEXTO}
                    onListo={preguntaLista}
                    className="glow mt-4 font-serif text-[clamp(1.35rem,3.2vw,2.5rem)] leading-[1.16] tracking-[-0.01em] md:mt-6"
                  />

                  {/* Se renderiza siempre: montarlo recién al estar listo haría
                      crecer el bloque de golpe y la pregunta saltaría. */}
                  <PapelSinRevelar onEnviar={enviar} listo={inputListo} />
                </motion.div>
              )}

              {acto === "colapso" && (
                <motion.div
                  key="colapso"
                  // Se sobreexpone y desaparece, como una copia que se quedó de
                  // más en la luz.
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(16px)" }}
                  transition={{ duration: 0.95, ease: "easeIn" }}
                >
                  <PreguntaRevelada
                    texto={site.invitacion}
                    demora={0.5}
                    duracion={2.3}
                    onListo={() => setActo("disco")}
                    className="glow text-center font-serif text-[clamp(1.25rem,2.9vw,2.2rem)] leading-[1.2]"
                  />
                </motion.div>
              )}

              {acto === "disco" && (
                <motion.div key="disco" className="flex justify-center">
                  {/* Sin `emerge`: la entrada default es la que ya está
                      aprobada en la landing #1 y no hay razón para tocarla. */}
                  <Disco onOtraVez={otraVez} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div
          aria-hidden
          className="grano pointer-events-none fixed inset-0 z-40 opacity-[0.055] mix-blend-overlay"
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
