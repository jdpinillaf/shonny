"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";

/** Dónde toca el agua, en fracción de viewport. Lo comparte la escena. */
export const IMPACTO = { x: 0.5, y: 0.42 };

const DEMORA = 0.5; // s antes de soltarla
const CAIDA = 1.05; // s de caída
const REBOTE = 0.46; // s entre el primer golpe y el del rebote

const TAM = 20;
const GOTITAS = 5;

/**
 * La gota.
 *
 * Tres cosas que hay que resistirse a hacer, porque son justo las que la
 * vuelven caricatura:
 *
 * 1. La forma de lágrima con punta arriba. Una gota en caída libre es casi
 *    esférica, un poco achatada. La lágrima es el ícono, no el objeto.
 * 2. El brillo blanco grande. El agua no tiene un shine de plástico: tiene el
 *    borde encendido por reflexión interna y, si acaso, un punto chiquito abajo
 *    donde enfoca la luz.
 * 3. Rellenarla de celeste. Una gota es transparente — se ve por lo que
 *    deforma detrás, no por su color.
 *
 * Por eso el cuerpo es `backdrop-filter` sobre el propio río: refracta de
 * verdad lo que tiene atrás. Y el arrastre vertical es lo que más suma, porque
 * algo que cae rápido se ve borroneado, nunca nítido.
 */
export function Gota({
  onImpacto,
  onRebote,
}: {
  onImpacto: () => void;
  onRebote: () => void;
}) {
  const [golpeo, setGolpeo] = useState(false);

  useEffect(() => {
    // Por reloj, no al terminar la animación: la onda tiene que salir cuando
    // toca el agua, no cuando termina de reventar.
    const t1 = setTimeout(() => {
      setGolpeo(true);
      onImpacto();
    }, (DEMORA + CAIDA) * 1000);
    const t2 = setTimeout(onRebote, (DEMORA + CAIDA + REBOTE) * 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onImpacto, onRebote]);

  const izq = `${IMPACTO.x * 100}%`;
  const alto = `${IMPACTO.y * 100}vh`;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-30">
      <motion.div
        className="absolute"
        style={{ left: izq, top: 0, marginLeft: -TAM / 2, width: TAM, height: TAM }}
        initial={{ y: "-8vh", opacity: 0 }}
        animate={{
          y: ["-8vh", alto, alto],
          scaleY: [1, 1.75, 0.3],
          scaleX: [1, 0.86, 2.1],
          opacity: [0, 1, 0],
        }}
        transition={{
          duration: CAIDA + 0.12,
          delay: DEMORA,
          times: [0, CAIDA / (CAIDA + 0.12), 1],
          ease: ["easeIn", "easeOut"],
        }}
      >
        {/* Arrastre: lo que el ojo lee como velocidad. */}
        <motion.span
          className="absolute left-1/2 bottom-1/2 -translate-x-1/2"
          style={{
            width: TAM * 0.48,
            height: TAM * 3.4,
            background:
              "linear-gradient(to top, rgba(206,232,246,0.5), rgba(206,232,246,0))",
            filter: "blur(1.4px)",
          }}
          initial={{ opacity: 0, scaleY: 0.3 }}
          animate={{ opacity: [0, 0.9, 0], scaleY: [0.3, 1, 0.2] }}
          transition={{ duration: CAIDA, delay: DEMORA, ease: "easeIn" }}
        />
        <Cuerpo />
      </motion.div>

      {golpeo && (
        <>
          {/* Corona: chispas chicas, no burbujas. */}
          {Array.from({ length: GOTITAS }, (_, i) => {
            const t = i / (GOTITAS - 1);
            const lado = (t - 0.5) * 2;
            const dx = lado * (24 + Math.abs(lado) * 24);
            const subida = 22 - Math.abs(lado) * 11;
            const d = 3 - Math.abs(lado) * 1.1;
            return (
              <motion.span
                key={i}
                className="absolute rounded-full"
                style={{
                  left: izq,
                  top: alto,
                  width: d,
                  height: d,
                  marginLeft: -d / 2,
                  background: "rgba(214,238,248,0.9)",
                  filter: "blur(0.3px)",
                }}
                initial={{ x: 0, y: 0, opacity: 0.9 }}
                animate={{ x: dx, y: [0, -subida, 14], opacity: [0.9, 0.75, 0] }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            );
          })}

          {/* Rebote: sube del centro, se queda un instante y vuelve a caer. */}
          <motion.div
            className="absolute"
            style={{
              left: izq,
              top: alto,
              marginLeft: -TAM * 0.26,
              width: TAM * 0.52,
              height: TAM * 0.52,
            }}
            initial={{ y: 0, opacity: 0, scaleY: 1.8 }}
            animate={{ y: [0, -48, -48, 0], opacity: [0.85, 1, 1, 0.85], scaleY: [1.8, 1, 1, 1.7] }}
            transition={{ duration: REBOTE, times: [0, 0.45, 0.58, 1], ease: "easeOut" }}
          >
            <Cuerpo />
          </motion.div>

          {/* Anillos: el del golpe y el del rebote. */}
          {[0, REBOTE].map((retardo, i) => (
            <motion.span
              key={i}
              className="absolute rounded-full border"
              style={{
                left: izq,
                top: alto,
                borderColor: "rgba(160,200,220,0.4)",
                borderWidth: 1,
              }}
              initial={{ width: 0, height: 0, margin: 0, opacity: 0.55 }}
              animate={{
                width: i === 0 ? 400 : 220,
                height: i === 0 ? 400 : 220,
                margin: i === 0 ? -200 : -110,
                opacity: 0,
              }}
              transition={{ duration: 1.5, delay: retardo, ease: "easeOut" }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/**
 * El cuerpo: una lente. No tiene color propio — deforma y aclara lo que hay
 * detrás, que en esta página es el río.
 */
function Cuerpo() {
  return (
    <div
      className="h-full w-full rounded-full"
      style={{
        backdropFilter: "blur(2.8px) brightness(1.7) saturate(0.6)",
        WebkitBackdropFilter: "blur(2.8px) brightness(1.7) saturate(0.6)",
        // Antes del impacto el río está velado y casi negro: si el cuerpo fuera
        // solo `backdrop-filter` no tendría nada que refractar y la gota se
        // vería como un aro vacío. Este relleno bajísimo le da masa sin
        // convertirla en la bolita celeste de antes.
        background:
          "radial-gradient(62% 58% at 42% 70%, rgba(228,245,253,0.26), rgba(228,245,253,0.07) 58%, rgba(228,245,253,0) 100%)",
        boxShadow: [
          // Borde encendido por reflexión interna: el rasgo real del agua.
          "inset 0 0 0 1px rgba(230,246,254,0.85)",
          // Abajo concentra luz, arriba queda en sombra.
          "inset 0 -4px 7px rgba(240,252,255,0.42)",
          "inset 0 4px 7px rgba(8,22,34,0.5)",
          "0 0 15px rgba(170,210,232,0.42)",
        ].join(", "),
      }}
    />
  );
}
