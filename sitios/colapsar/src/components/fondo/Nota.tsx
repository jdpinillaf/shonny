"use client";

import { motion } from "motion/react";
import { type Pieza } from "@/content/pieza";
import { entre } from "@/lib/semilla";
import { Chinche } from "./Chinche";
import { Papel } from "./Papel";
import { type Origen } from "./origen";

/**
 * Dónde cuelga el papel. `y` se mide desde arriba, salvo que `desdeAbajo` diga
 * que se mide desde abajo: una nota del montón de abajo no puede colocarse por
 * su borde de arriba sin saber cuánto mide, y cuánto mide depende del texto.
 */
export type Ranura = { x: string; y: string; desdeAbajo?: boolean };

type Props = {
  pieza: Pieza;
  ranura: Ranura;
  /** La que acaba de escribir la persona: entra desde el centro y se queda encendida. */
  nueva?: boolean;
  quieto: boolean;
  onAbrir: (origen: Origen) => void;
  /** Está abierta en grande: se apaga acá para que no se vea dos veces. */
  oculta?: boolean;
};

/** El papel colgado de la pared: su ranura, su chinche y su péndulo. */
export function Nota({
  pieza,
  ranura,
  nueva = false,
  quieto,
  onAbrir,
  oculta = false,
}: Props) {
  // La semilla es el id y no el texto: dos personas escriben lo mismo y sus dos
  // notas colgarían con la misma inclinación y el mismo vaivén, que es justo el
  // tipo de coincidencia que se lee como error.
  const semilla = pieza.id;
  const reposo = entre(semilla, -3.4, 3.4, 1);

  const sitio: React.CSSProperties = {
    left: ranura.x,
    ...(ranura.desdeAbajo ? { bottom: ranura.y } : { top: ranura.y }),
  };

  const papel = (
    <div
      className="nota relative"
      style={
        {
          "--reposo": `${reposo.toFixed(2)}deg`,
          "--vaiven": quieto ? "0deg" : `${entre(semilla, 0.5, 1.4, 2).toFixed(2)}deg`,
          "--dur": `${entre(semilla, 6, 10, 3).toFixed(1)}s`,
          "--retardo": `-${entre(semilla, 0, 8, 4).toFixed(1)}s`,
        } as React.CSSProperties
      }
    >
      {/* El chinche. Es también el eje del péndulo. */}
      <Chinche tamano={7} />

      <Papel pieza={pieza} reposo={reposo} onAbrir={onAbrir} oculta={oculta} />
    </div>
  );

  // La recién escrita sigue con motion, y tiene que seguir: vuela desde el
  // centro hasta su sitio y necesita `exit` para que `AnimatePresence` la pueda
  // recoger. Es una sola, aparece por un gesto de la persona y para entonces el
  // JavaScript lleva rato corriendo, así que su `initial` en el HTML no le
  // cuesta nada a nadie.
  if (nueva) {
    return (
      <motion.div
        className="pointer-events-none absolute w-[42vw] max-w-[196px] md:w-[184px]"
        style={sitio}
        initial={{ opacity: 0, scale: 0.82, x: "-50%", y: 90, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, x: "-50%", y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.4 } }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {papel}
      </motion.div>
    );
  }

  // Las de la pared entran con CSS.
  //
  // Con motion, su `initial` se serializaba en el HTML del servidor como
  // `opacity:0` y llegaban **las veintidós invisibles**: la pared existía en el
  // documento desde el primer byte pero no se veía hasta que el navegador
  // acababa de bajar y ejecutar el JavaScript. Un `@keyframes` no espera a
  // nadie.
  //
  // De paso se va un efecto que se quedaba pegado: el `filter: "blur(0px)"` del
  // `animate` valía para todas y no solo para la nueva, y motion deja el valor
  // final como estilo inline. Veintidós notas con un `filter` permanente son
  // veintidós capas de GPU y el texto sin suavizado subpíxel, para siempre.
  return (
    <div
      className="colgada entra pointer-events-none absolute w-[42vw] max-w-[196px] md:w-[184px]"
      style={
        {
          ...sitio,
          "--entrada-dur": "1.5s",
          // Detrás de los televisores, que arrancan entre 0.25s y 1.5s
          // (`Canales.tsx`): el fondo emerge primero y los papeles se van
          // pinchando encima. Con el reparto anterior —de 0s a 1.2s— las notas
          // estaban a medio camino cuando los televisores no habían empezado, y
          // la página se llenaba de texto sobre negro.
          "--entrada-retardo": `${entre(semilla, 0.9, 2.1, 7).toFixed(2)}s`,
          "--entrada-desde": "10px",
        } as React.CSSProperties
      }
    >
      {papel}
    </div>
  );
}
